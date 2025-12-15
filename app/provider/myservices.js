// app/provider/myservices.js
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Button, Alert, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "../../firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot, doc, deleteDoc } from "firebase/firestore";

export default function MyServices() {
  const router = useRouter();
  const [uid, setUid] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const DEBUG = true;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (DEBUG) console.log("[MyServices] onAuthStateChanged -> uid:", u ? u.uid : null);
      setUid(u ? u.uid : null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) {
      if (DEBUG) console.log("[MyServices] no uid - clearing services");
      setServices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    if (DEBUG) console.log("[MyServices] subscribing to services for uid:", uid);

    const q = query(collection(db, "services"), where("providerId", "==", uid));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (DEBUG) console.log("[MyServices] onSnapshot -> got", docs.length, "services");
      setServices(docs);
      setLoading(false);
    }, (err) => {
      console.error("[MyServices] onSnapshot error:", err);
      Alert.alert("Error", String(err));
      setLoading(false);
    });

    return () => {
      if (DEBUG) console.log("[MyServices] unsubscribing");
      unsub();
    };
  }, [uid]);

  // Robust navigation to Edit screen (works on web + native)
  const goToEdit = (service) => {
    if (!service || !service.id) {
      console.warn("[MyServices] goToEdit called without service id", service);
      return;
    }
    if (DEBUG) console.log("[MyServices] Edit pressed for", service.id);

    const path = `/provider/editservice?serviceId=${encodeURIComponent(service.id)}`;

    // On web use full location change to avoid router issues with expo-router + web
    if (typeof window !== "undefined" && window.location) {
      const origin = window.location.origin;
      // avoid unnecessary reload if already at target
      const target = origin + path;
      if (window.location.href !== target) {
        window.location.href = target;
      }
      return;
    }

    // Native (expo-router)
    router.push({
      pathname: "/provider/editservice",
      params: { serviceId: service.id }
    });
  };

  const confirmDelete = (serviceId) => {
    if (DEBUG) console.log("[MyServices] confirmDelete called for", serviceId);

    try {
      if (typeof window !== "undefined" && typeof window.confirm === "function") {
        const ok = window.confirm("Delete this service? This action cannot be undone.");
        if (ok) doDelete(serviceId);
        return;
      }
    } catch (e) {
      console.warn("[MyServices] window.confirm fallback failed:", e);
    }

    Alert.alert(
      "Delete service",
      "Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => doDelete(serviceId) }
      ],
      { cancelable: true }
    );
  };

  const doDelete = async (serviceId) => {
    if (DEBUG) console.log("[MyServices] Delete button pressed for", serviceId);
    try {
      if (!uid) { Alert.alert("Sign in required"); if (DEBUG) console.log("[MyServices] no uid - abort delete"); return; }

      const ref = doc(db, "services", serviceId);
      if (DEBUG) console.log("[MyServices] attempting deleteDoc for", serviceId, "ref:", ref.path || "(no path)");

      await deleteDoc(ref);

      if (DEBUG) console.log("[MyServices] deleteDoc succeeded for", serviceId);
      try {
        if (typeof window !== "undefined" && window.alert) window.alert("Service deleted.");
        else Alert.alert("Deleted", "Service removed.");
      } catch (e) { /* ignore */ }
      // onSnapshot refreshes the list automatically
    } catch (err) {
      console.error("[MyServices] delete failed:", err);
      Alert.alert("Delete failed", String(err));
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading your services...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <Text style={styles.title}>My Services</Text>

      {services.length === 0 ? (
        <Text>No services found. Add one from Add Service.</Text>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.title || item.name || "Untitled"}</Text>
              <Text>Type: {item.category || "-"}</Text>
              <Text>Price: {item.price ? `₹${item.price}` : "Not set"}</Text>
              <Text>Added: {item.createdAt ? (item.createdAt.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleString() : String(item.createdAt)) : "-"}</Text>
              <View style={{ height: 8 }} />
              <Button title="Edit" onPress={() => goToEdit(item)} />
              <View style={{ height: 8 }} />
              <Button title="Delete" color="red" onPress={() => confirmDelete(item.id)} />
            </View>
          )}
        />
      )}

      <View style={{ marginTop: 14 }}>
        <Button title="Add new service" onPress={() => router.push("/provider/addservice")} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  card: { borderWidth: 1, borderRadius: 6, padding: 12, marginBottom: 10, backgroundColor: "white" },
  cardTitle: { fontWeight: "700", fontSize: 16, marginBottom: 6 }
});
