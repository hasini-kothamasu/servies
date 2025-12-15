// app/provider/dashboard.js
import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig.js";

function goTo(router, path) {
  if (typeof window !== "undefined" && window.location) {
    const target = window.location.origin + path;
    if (window.location.href !== target) window.location.href = target;
    return;
  }
  router.replace(path);
}

export default function ProviderDashboard() {
  const router = useRouter();

  const doLogout = async () => {
    try {
      await signOut(auth);
      goTo(router, "/login");
    } catch (e) {
      alert("Logout failed: " + String(e));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Provider Dashboard</Text>

      <View style={styles.buttonRow}>
        <Button title="Add Service" onPress={() => goTo(router, "/provider/addservice")} />
      </View>

      <View style={styles.buttonRow}>
        <Button title="My Services" onPress={() => goTo(router, "/provider/myservices")} />
      </View>

      <View style={styles.buttonRow}>
        <Button title="Incoming Bookings" onPress={() => goTo(router, "/provider/bookings")} />
      </View>

      <View style={styles.buttonRow}>
        <Button title="Completed Bookings" onPress={() => goTo(router, "/provider/bookings?tab=completed")} />
      </View>
<View style={styles.buttonRow}>
        <Button title="Your earnings" onPress={() => goTo(router, "/provider/earnings")} />
      </View>
      <View style={{ height: 18 }} />
      <Button title="Logout" onPress={doLogout} color="#c33" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f2f4f8"
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 20
  },

  buttonRow: {
    marginBottom: 14,
    borderRadius: 10,
    overflow: "hidden"
  }
});
