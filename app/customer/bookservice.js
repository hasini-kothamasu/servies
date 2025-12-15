// app/customer/bookservice.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  ActivityIndicator,
  Alert,
  StyleSheet
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { auth, db } from "../../firebaseConfig";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp
} from "firebase/firestore";

/* ---------------- TIME SLOTS ---------------- */
const TIME_SLOTS = [
  "08:00 AM",
  "09:00 AM",
  "10:30 AM",
  "12:00 PM",
  "01:30 PM",
  "03:00 PM",
  "04:30 PM",
  "06:00 PM",
  "07:30 PM"
];

export default function BookService() {
  const router = useRouter();
  const { serviceId } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [service, setService] = useState(null);
  const [slot, setSlot] = useState(TIME_SLOTS[2]);
  const [confirming, setConfirming] = useState(false);

  /* ---------------- LOAD SERVICE ---------------- */
  useEffect(() => {
    const loadService = async () => {
      if (!serviceId) {
        setLoading(false);
        Alert.alert("Error", "No service selected.");
        router.replace("/customer/services");
        return;
      }

      try {
        const ref = doc(db, "services", serviceId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          Alert.alert("Not found", "Service not found.");
          router.replace("/customer/services");
          return;
        }

        setService({ id: snap.id, ...snap.data() });
      } catch (err) {
        console.error("Load service failed:", err);
        Alert.alert("Error", "Failed to load service.");
        router.replace("/customer/services");
      } finally {
        setLoading(false);
      }
    };

    loadService();
  }, [serviceId]);

  /* ---------------- CONFIRM BOOKING ---------------- */
  const confirmBooking = async () => {
    if (!service) {
      Alert.alert("Error", "Service not loaded.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Login required", "Please login first.");
      return;
    }

    setConfirming(true);

    try {
      const userSnap = await getDoc(doc(db, "users", user.uid));
      const userData = userSnap.data();

      const bookingPayload = {
        serviceId: service.id,
        serviceTitle: service.title || service.subservice || "Service",

        providerId: service.providerId,
        providerName: service.providerName,
        providerPhone: service.providerPhone,

        customerId: user.uid,
        customerName: userData.name,
        customerPhone: userData.phone,
        customerAddress: userData.address,

        timeSlot: slot,
        price: Number(service.price || 0),
        status: "requested",
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "bookings"), bookingPayload);

      window.alert("✅ Booking confirmed!");
      router.replace("/customer/bookings");
      setTimeout(() => {
        window.location.href = "/customer/bookings";
      }, 100);
    } catch (err) {
      console.error("Booking failed:", err);
      Alert.alert("Failed", "Booking failed. Try again.");
    } finally {
      setConfirming(false);
    }
  };

  /* ---------------- UI ---------------- */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading service...</Text>
      </View>
    );
  }

  if (!service) {
    return (
      <View style={styles.center}>
        <Text>No service found.</Text>
        <Button
          title="Back to services"
          onPress={() => router.replace("/customer/services")}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>
          {service.title || service.subservice}
        </Text>

        <Text style={styles.provider}>
          Provider: {service.providerName}
        </Text>

        <Text style={styles.price}>₹{service.price}</Text>

        <Text style={styles.label}>Choose time slot</Text>

        <View style={styles.pickerBox}>
          <Picker selectedValue={slot} onValueChange={setSlot}>
            {TIME_SLOTS.map((s) => (
              <Picker.Item key={s} label={s} value={s} />
            ))}
          </Picker>
        </View>

        {confirming ? (
          <ActivityIndicator size="large" />
        ) : (
          <View style={styles.buttonBox}>
            <Button
              title="Confirm Booking"
              onPress={confirmBooking}
              color="#16a34a"
            />
          </View>
        )}
      </View>
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f3f4f6"
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    marginTop: 8,
    color: "#374151"
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6
  },
  provider: {
    color: "#374151",
    marginBottom: 6
  },
  price: {
    fontSize: 20,
    fontWeight: "800",
    color: "#16a34a",
    marginBottom: 12
  },
  label: {
    fontWeight: "700",
    marginBottom: 6
  },
  pickerBox: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    marginBottom: 14,
    overflow: "hidden"
  },
  buttonBox: {
    marginTop: 6
  }
});
