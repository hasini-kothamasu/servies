// app/provider/earnings.js
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, Button, Alert, StyleSheet } from "react-native";
import { auth, db } from "../../firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";

export default function ProviderEarnings() {
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState(null);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingPayout, setPendingPayout] = useState(0);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUid(u ? u.uid : null);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!uid) {
      setCompletedBookings([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    // Listen for completed bookings for this provider
    const q = query(collection(db, "bookings"), where("providerId", "==", uid));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // filter completed
      const completed = items.filter(i => i.status === "completed");
      // compute sums
      let total = 0;
      let pending = 0;
      completed.forEach(c => {
        const p = Number(c.price || c.servicePrice || 0) || 0;
        total += p;
        if (!c.payoutRequested && !c.paid) pending += p;
      });
      setCompletedBookings(completed.sort((a,b)=> (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0)));
      setTotalEarnings(total);
      setPendingPayout(pending);
      setLoading(false);
    }, (err) => {
      console.error("[ProviderEarnings] onSnapshot error:", err);
      Alert.alert("Error", String(err));
      setLoading(false);
    });

    return () => unsub();
  }, [uid]);

  const requestPayout = async () => {
    if (!uid) return Alert.alert("Not signed in", "Please sign in as provider.");
    if (processing) return;
    if (pendingPayout <= 0) return Alert.alert("Nothing to payout", "No pending earnings available.");

    setProcessing(true);
    try {
      // Mark all completed bookings that are not yet payoutRequested as requested
      const batchUpdates = completedBookings.filter(b => !b.payoutRequested && !b.paid);
      for (const b of batchUpdates) {
        await updateDoc(doc(db, "bookings", b.id), {
          payoutRequested: true,
          payoutRequestedAt: serverTimestamp()
        });
      }
      Alert.alert("Payout requested", `Requested ₹${pendingPayout} for payout. You will get confirmation later.`);
    } catch (e) {
      console.error("[ProviderEarnings] requestPayout failed:", e);
      Alert.alert("Request failed", String(e));
    } finally {
      setProcessing(false);
    }
  };

  const markPaid = async (bookingId) => {
    if (!uid) return;
    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        paid: true,
        paidAt: serverTimestamp()
      });
      Alert.alert("Marked paid", "Booking marked as paid.");
    } catch (e) {
      console.error("markPaid failed:", e);
      Alert.alert("Failed", String(e));
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading earnings...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={styles.title}>Earnings</Text>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>Total earned: ₹{totalEarnings}</Text>
        <Text style={styles.summaryText}>Pending payout: ₹{pendingPayout}</Text>
      </View>

      <View style={{ marginBottom: 12 }}>
        <Button title={processing ? "Requesting..." : `Request Payout ₹${pendingPayout}`} disabled={processing || pendingPayout <= 0} onPress={requestPayout} />
      </View>

      <Text style={{ marginBottom: 8, fontWeight: "600" }}>Completed Jobs</Text>

      {completedBookings.length === 0 ? (
        <Text>No completed jobs yet.</Text>
      ) : (
        <FlatList
          data={completedBookings}
          keyExtractor={i => i.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.serviceTitle || item.serviceId}</Text>
              <Text>Customer: {item.customerName || item.customerId || "-"}</Text>
              <Text>Contact: {item.customerPhone || "-"}</Text>
              <Text>Amount: ₹{item.price || item.servicePrice || 0}</Text>
              <Text>Booked at: {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleString() : "-"}</Text>
              <Text>Payout requested: {item.payoutRequested ? "Yes" : "No"}</Text>
              <Text>Paid: {item.paid ? `Yes (${item.paidAt ? new Date(item.paidAt.seconds*1000).toLocaleString() : ""})` : "No"}</Text>

              <View style={{ height: 8 }} />
              {!item.paid && item.payoutRequested && (
                <Button title="Mark Paid (admin action)" onPress={() => markPaid(item.id)} />
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  summary: { marginBottom: 12 },
  summaryText: { fontSize: 16, fontWeight: "600" },
  card: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 10, backgroundColor: "white" },
  cardTitle: { fontWeight: "700", fontSize: 16, marginBottom: 6 }
});
