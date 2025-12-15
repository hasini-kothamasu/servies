import React from "react";
import { View, Text, Button, Alert } from "react-native";
import { useRouter, useSearchParams } from "expo-router";

export default function Booking() {
  const router = useRouter();
  const params = useSearchParams(); // future: { service: 'Plumbing' }

  const handleBook = () => {
    // placeholder action — later we'll save to Firestore
    Alert.alert("Booking placed", `Service: ${params.service || "General"}`);
    // router.replace("(main)/myBookings"); // optional navigation
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 12 }}>Booking</Text>
      <Text style={{ marginBottom: 12 }}>
        Service: {params.service || "Select a service"}
      </Text>

      <Button title="Place Booking" onPress={handleBook} />
      <View style={{ height: 12 }} />
      <Button title="Back to Subservices" onPress={() => router.back()} />
    </View>
  );
}
