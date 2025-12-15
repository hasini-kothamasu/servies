// app/provider/bookings.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  Button,
  Alert,
  StyleSheet
} from "react-native";
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

export default function ProviderBookings() {
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) =>
      setUid(u ? u.uid : null)
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) {
      setBookings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "bookings"),
      where("providerId", "==", uid)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        items.sort(
          (a, b) =>
            (b.createdAt?.seconds || 0) -
            (a.createdAt?.seconds || 0)
        );
        setBookings(items);
        setLoading(false);
      },
      (err) => {
        console.error("[ProviderBookings] error:", err);
        Alert.alert("Error", String(err));
        setLoading(false);
      }
    );

    return () => unsub();
  }, [uid]);

  const updateStatus = async (bookingId, newStatus) => {
    try {
      const ref = doc(db, "bookings", bookingId);
      await updateDoc(ref, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      Alert.alert("Updated", `Booking marked ${newStatus}`);
    } catch (e) {
      console.error("updateStatus failed:", e);
      Alert.alert("Failed", e.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>
          Loading bookings...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={styles.title}>
        Incoming Bookings
      </Text>

      {bookings.length === 0 ? (
        <Text>No bookings yet.</Text>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(i) => i.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* SERVICE */}
              <Text style={styles.cardTitle}>
                {item.serviceTitle || "Service"}
              </Text>

              <Text style={styles.status}>
                Status: {item.status}
              </Text>

              {/* CUSTOMER */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Customer
                </Text>
                <Text>Name: {item.customerName || "-"}</Text>
                <Text>Phone: {item.customerPhone || "-"}</Text>
                <Text>Address: {item.customerAddress || "-"}</Text>
              </View>

              {/* TIME */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Requested Time
                </Text>
                <Text>{item.timeSlot || "-"}</Text>
              </View>

              {/* PAYMENT */}
              <View style={styles.paymentRow}>
                <Text style={styles.amount}>
                  ₹{item.price || 0}
                </Text>
                <Text
                  style={[
                    styles.paymentStatus,
                    { color: item.paymentDone ? "green" : "red" }
                  ]}
                >
                  {item.paymentDone
                    ? "Paid ✅"
                    : "Not paid ❌"}
                </Text>
              </View>

              {/* ACTIONS */}
              {item.status === "requested" && (
                <>
                  <Button
                    title="Accept"
                    onPress={() =>
                      updateStatus(item.id, "accepted")
                    }
                  />
                  <View style={{ height: 8 }} />
                  <Button
                    title="Reject"
                    color="red"
                    onPress={() =>
                      updateStatus(item.id, "rejected")
                    }
                  />
                </>
              )}

              {item.status === "accepted" && (
                <Button
                  title="Mark Enroute"
                  onPress={() =>
                    updateStatus(item.id, "enroute")
                  }
                />
              )}

              {item.status === "enroute" && (
                <>
                  <Text style={styles.enrouteText}>
                    On the way 🚶
                  </Text>
                  <Button
                    title="Complete"
                    onPress={() =>
                      updateStatus(item.id, "completed")
                    }
                  />
                </>
              )}

              {item.status === "completed" && (
                <Text style={styles.completedText}>
                  Completed 🎉
                </Text>
              )}
            </View>
          )}
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
    padding: 20
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 14
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6
  },

  status: {
    fontWeight: "600",
    marginBottom: 10
  },

  section: {
    marginBottom: 10
  },

  sectionTitle: {
    fontWeight: "700",
    marginBottom: 2
  },

  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },

  amount: {
    fontSize: 18,
    fontWeight: "800"
  },

  paymentStatus: {
    fontWeight: "700"
  },

  enrouteText: {
    marginBottom: 6,
    fontWeight: "600"
  },

  completedText: {
    marginTop: 6,
    fontWeight: "700",
    color: "green"
  }
});
