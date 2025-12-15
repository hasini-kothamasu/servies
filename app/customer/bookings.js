// app/customer/bookings.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Button,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity
} from "react-native";
import { auth, db } from "../../firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";

/**
 * Customer Bookings screen
 * - Tabs: Active / Completed / Cancelled
 * - Status alerts
 * - Cancel booking
 * - Payment simulation
 */

const STATUS_ACTIVE = ["requested", "accepted", "enroute"];
const STATUS_COMPLETED = ["completed"];
const STATUS_CANCELLED = ["cancelled", "rejected"];

function friendlyStatus(status) {
  switch (status) {
    case "requested": return "Waiting for provider ⏳";
    case "accepted": return "Provider accepted ✅";
    case "enroute": return "Provider on the way 🚗";
    case "completed": return "Service completed 🎉";
    case "rejected": return "Rejected ❌";
    case "cancelled": return "Cancelled ❌";
    default: return status || "-";
  }
}

export default function CustomerBookings() {
  const [uid, setUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState("active");
  const prevMapRef = useRef({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUid(u ? u.uid : null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      setBookings([]);
      prevMapRef.current = {};
      return;
    }

    setLoading(true);
    const q = query(collection(db, "bookings"), where("customerId", "==", uid));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      const prevMap = prevMapRef.current || {};
      items.forEach(item => {
        const prev = prevMap[item.id];
        if (prev && prev.status !== item.status) {
          Alert.alert("Booking update", friendlyStatus(item.status));
        }
      });

      const map = {};
      items.forEach(i => map[i.id] = { status: i.status });
      prevMapRef.current = map;

      setBookings(items);
      setLoading(false);
    });

    return () => unsub();
  }, [uid]);

  const filtered = bookings.filter(b => {
    if (tab === "active") return STATUS_ACTIVE.includes(b.status);
    if (tab === "completed") return STATUS_COMPLETED.includes(b.status);
    if (tab === "cancelled") return STATUS_CANCELLED.includes(b.status);
    return true;
  });

  /* ---------------- PAYMENT ---------------- */
  const startPayment = async (booking) => {
    if (typeof window !== "undefined") {
      const ok = window.confirm(`Pay ₹${booking.price || 0}?`);
      if (!ok) return;
    }
    await updateDoc(doc(db, "bookings", booking.id), {
      paymentDone: true,
      paidAt: serverTimestamp()
    });
    alert("Payment successful ✅");
  };

  /* ---------------- CANCEL ---------------- */
  const cancelBooking = async (bookingId) => {
    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        status: "cancelled"
      });
      alert("Booking cancelled ❌");
    } catch (e) {
      alert("Cancel failed");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.serviceTitle || "Service"}</Text>

      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>
          {friendlyStatus(item.status)}
        </Text>
      </View>

      <Text style={styles.line}>Provider: {item.providerName || "-"}</Text>
      <Text style={styles.line}>Phone: {item.providerPhone || "-"}</Text>
      <Text style={styles.line}>Amount: ₹{item.price || 0}</Text>

      <View style={{ height: 8 }} />

      {tab === "completed" && !item.paymentDone && (
        <Button title={`Pay Now ₹${item.price || 0}`} onPress={() => startPayment(item)} />
      )}

      {tab === "completed" && item.paymentDone && (
        <Text style={styles.successText}>Payment completed ✅</Text>
      )}

      {tab === "active" && ["requested", "accepted"].includes(item.status) && (
        <Button color="red" title="Cancel" onPress={() => cancelBooking(item.id)} />
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading bookings...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={styles.title}>My Bookings</Text>

      <View style={styles.tabs}>
        {["active", "completed", "cancelled"].map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={tab === t ? styles.tabActiveText : styles.tabText}>
              {t.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <Text>No bookings here.</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f2f4f8"
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 14,
    color: "#111"
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 0,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
    color: "#0a84ff"
  },

  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 6,
    backgroundColor: "#e6ecff",
    alignItems: "center"
  },

  tabActive: {
    backgroundColor: "#0a84ff"
  },

  tabText: {
    color: "#333",
    fontWeight: "600"
  },

  tabActiveText: {
    color: "#fff",
    fontWeight: "700"
  }
});
