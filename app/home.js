// app/home.js
import React, { useState, useEffect } from "react";
import { View, Text, Button, Alert, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function Home() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");
  const [role, setRole] = useState(null); // 👈 customer / provider
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      setUserEmail(user.email || "");

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          setRole(snap.data().role); // 👈 IMPORTANT
        }
      } catch (e) {
        console.error("Failed to load role", e);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (e) {
      Alert.alert("Logout failed", String(e));
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.appName}>Markapuram Services</Text>
      <Text style={styles.email}>Signed in as: {userEmail}</Text>

      {/* ---------- CUSTOMER ACTIONS ---------- */}
      {role === "customer" && (
        <>
          <Text style={styles.section}>👤 Customer Actions</Text>
          <Button title="Browse Services" onPress={() => router.push("/customer/services")} />
          <View style={styles.space} />
          <Button title="My Bookings" onPress={() => router.push("/customer/bookings")} />
          <View style={styles.space} />
          <Button title="Edit Profile" onPress={() => router.push("/customer/profile")} />
        </>
      )}

      {/* ---------- PROVIDER ACTIONS ---------- */}
      {role === "provider" && (
        <>
          <Text style={styles.section}>🛠 Provider Actions</Text>
          <Button title="Add Service" onPress={() => router.push("/provider/addservice")} />
          <View style={styles.space} />
          <Button title="My Services" onPress={() => router.push("/provider/myservices")} />
          <View style={styles.space} />
          <Button title="Incoming Bookings" onPress={() => router.push("/provider/bookings")} />
        </>
      )}

      <View style={{ height: 20 }} />
      <Button title="Logout" color="#c33" onPress={handleLogout} />
    </View>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  appName: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 6
  },
  email: {
    color: "#555",
    marginBottom: 16
  },
  section: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 10
  },
  space: {
    height: 10
  }
});
