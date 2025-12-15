// app/main/myBookings/index.js
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, FlatList, Button, Alert, StyleSheet } from "react-native";
import { auth, db } from "../../../firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore";

export default function MyBookings() {
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUid(u ? u.uid : null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) {
      setBookings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(collection(db, "bookings"), where("customerId", "==", uid));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a,b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      setBookings(items);
      setLoading(false);
    }, (err) => {
      console.error("[MyBookings] onSnapshot error:", err);
      Alert.alert("Error", String(err));
      setLoading(false);
    });
    return () => unsub();
  }, [uid]);

  // Enrich bookings with providerName/phone if missing
  useEffect(() => {
    if (!bookings || bookings.length === 0) return;
    let mounted = true;
    (async () => {
      try {
        const needs = bookings.filter(b => (!b.providerName || !b.providerPhone) && b.providerId);
        if (needs.length === 0) return;
        const updates = {};
        await Promise.all(needs.map(async (b) => {
          try {
            const snap = await getDoc(doc(db, "users", b.providerId));
            if (snap.exists()) {
              updates[b.id] = {
                providerName: snap.data().name || "",
                providerPhone: snap.data().phone || ""
              };
            }
          } catch (e) {
            // ignore
          }
        }));
        if (!mounted) return;
        if (Object.keys(updates).length > 0) {
          setBookings(prev => prev.map(p => updates[p.id] ? { ...p, ...updates[p.id] } : p));
        }
      } catch (e) {
        console.warn("[MyBookings] enrich error:", e);
      }
    })();
    return () => { mounted = false; };
  }, [bookings]);

  const cancelBooking = async (bookingId) => {
    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        status: "cancelled",
        updatedAt: serverTimestamp()
      });
      Alert.alert("Cancelled", "Your booking was cancelled.");
    } catch (e) {
      console.error("[MyBookings] cancel failed:", e);
      Alert.alert("Cancel failed", String(e));
    }
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
      <Text style={{marginTop:8}}>Loading your bookings...</Text>
    </View>
  );

  const active = bookings.filter(b => b.status === "requested" || b.status === "accepted" || b.status === "enroute");
  const completed = bookings.filter(b => b.status === "completed");
  const cancelled = bookings.filter(b => b.status === "cancelled" || b.status === "rejected");

  return (
    <View style={{ flex:1, padding:16 }}>
      <Text style={styles.title}>Active Bookings</Text>
      {active.length === 0 ? <Text>No active bookings.</Text> : (
        <FlatList
          data={active}
          keyExtractor={i => i.id}
          renderItem={({item}) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.serviceTitle || item.serviceId}</Text>
              <Text>Status: {item.status}</Text>
              <Text>Provider: {item.providerName || item.providerId || "-"}</Text>
              <Text>Provider Contact: {item.providerPhone || "-"}</Text>
              <Text>Booked at: {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleString() : "-"}</Text>
              <View style={{height:8}} />
              {item.status === "requested" && (
                <Button title="Cancel" color="red" onPress={() => cancelBooking(item.id)} />
              )}
              {item.status === "accepted" && <Text>Accepted — provider: {item.providerName || "-"}</Text>}
              {item.status === "enroute" && <Text>On the way — provider: {item.providerName || "-"}</Text>}
            </View>
          )}
        />
      )}

      <View style={{height:18}} />
      <Text style={styles.title}>Completed</Text>
      {completed.length === 0 ? <Text>No completed bookings.</Text> : (
        <FlatList
          data={completed}
          keyExtractor={i => i.id}
          renderItem={({item}) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.serviceTitle || item.serviceId}</Text>
              <Text>Completed at: {item.updatedAt ? new Date(item.updatedAt.seconds * 1000).toLocaleString() : "-"}</Text>
              <Text>Provider: {item.providerName || "-"}</Text>
              <Text>Provider Contact: {item.providerPhone || "-"}</Text>
            </View>
          )}
        />
      )}

      <View style={{height:18}} />
      <Text style={styles.title}>Cancelled / Rejected</Text>
      {cancelled.length === 0 ? <Text>No cancelled bookings.</Text> : (
        <FlatList
          data={cancelled}
          keyExtractor={i => i.id}
          renderItem={({item}) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.serviceTitle || item.serviceId}</Text>
              <Text>Status: {item.status}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex:1, justifyContent:"center", alignItems:"center", padding:20 },
  title: { fontSize:20, fontWeight:"600", marginBottom:8 },
  card: { borderWidth:1, borderRadius:6, padding:12, marginBottom:10, backgroundColor:"white" },
  cardTitle: { fontWeight:"700", fontSize:16, marginBottom:6 }
});
