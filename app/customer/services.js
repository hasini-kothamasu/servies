// app/customer/services.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Button,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity
} from "react-native";
import { useRouter } from "expo-router";
import { db } from "../../firebaseConfig.js";
import { collection, query, onSnapshot } from "firebase/firestore";

export default function ServicesList() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "services"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setServices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("[Services] onSnapshot error:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // ⚠️ DO NOT TOUCH — logic unchanged
  const openBook = (svc) => {
    if (!svc || !svc.id) {
      try {
        if (typeof window !== "undefined" && window.alert) {
          window.alert("Invalid service selected.");
        }
      } catch {}
      return;
    }

    const id = svc.id;
    console.log("[ServicesList] openBook called with:", id);

    try {
      router.push(`/customer/bookservice?serviceId=${encodeURIComponent(id)}`);
      return;
    } catch {}

    try {
      if (typeof window !== "undefined") {
        window.location.href = `/customer/bookservice?serviceId=${encodeURIComponent(id)}`;
        return;
      }
    } catch {}

    try {
      router.replace({ pathname: "/customer/bookservice", params: { serviceId: id } });
    } catch (e) {
      console.error("[ServicesList] navigation failed:", e);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading services...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#f2f4f8" }}>
      <Text style={styles.title}>Available Services</Text>

      <FlatList
        data={services}
        keyExtractor={(i) => i.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.category}>
              {item.category || "Service"}
            </Text>

            <Text style={styles.cardTitle}>
              {item.title || item.name || "Service"}
            </Text>

            <Text style={styles.price}>
              ₹{item.price || "Not set"}
            </Text>

            <Text style={styles.provider}>
              By {item.providerName || "Provider"}
            </Text>

            <TouchableOpacity
              style={styles.bookBtn}
              onPress={() => openBook(item)}
            >
              <Text style={styles.bookBtnText}>Book Service</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 14
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
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
  }
});
