// app/provider/editservice.js
import React, { useEffect, useState, useRef } from "react";
import { View, Text, TextInput, Button, Alert, ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "../../firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function EditService() {
  const router = useRouter();
  const [uid, setUid] = useState(null);

  const [serviceId, setServiceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

  const triesRef = useRef(0);
  const DEBUG = true;

  // robust function to obtain serviceId from URL (web) or pathname fallback
  function readServiceIdFromUrl() {
    try {
      if (typeof window !== "undefined" && window.location) {
        const qs = window.location.search || "";
        if (qs) {
          const params = new URLSearchParams(qs);
          const s = params.get("serviceId");
          if (s) return decodeURIComponent(s);
        }
        // fallback: maybe the id is last path segment
        const path = window.location.pathname || "";
        const segs = path.split("/").filter(Boolean);
        if (segs.length) {
          const last = segs[segs.length - 1];
          // if last looks like an id (length > 6), return it
          if (last && last.length > 6 && !last.includes(".")) return last;
        }
      }
    } catch (e) {
      console.warn("[EditService] readServiceIdFromUrl error:", e);
    }
    return null;
  }

  // watch auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (DEBUG) console.log("[EditService] onAuthStateChanged ->", u ? u.uid : "no auth");
      setUid(u ? u.uid : null);
    });
    return () => unsub();
  }, []);

  // attempt to obtain serviceId (retry a few times because expo-router can hydrate late)
  useEffect(() => {
    if (serviceId) return;

    const tryRead = () => {
      const s = readServiceIdFromUrl();
      if (s) {
        if (DEBUG) console.log("[EditService] got serviceId from URL:", s);
        setServiceId(s);
        return;
      }

      triesRef.current += 1;
      if (triesRef.current < 6) {
        // try again shortly
        if (DEBUG) console.log("[EditService] serviceId not found yet, retry", triesRef.current);
        setTimeout(tryRead, 150); // retry
      } else {
        if (DEBUG) console.log("[EditService] no service param found - redirecting to myservices");
        // redirect as fallback
        try {
          if (typeof window !== "undefined" && window.location) window.location.href = `${window.location.origin}/provider/myservices`;
          else router.replace("/provider/myservices");
        } catch (e) {
          router.replace("/provider/myservices");
        }
      }
    };

    tryRead();
  }, [serviceId]);

  // when we have serviceId, fetch document
  useEffect(() => {
    const load = async () => {
      if (!serviceId) return;
      setLoading(true);
      try {
        const ref = doc(db, "services", serviceId);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          if (DEBUG) console.log("[EditService] service doc not found:", serviceId);
          Alert.alert("Not found", "Service not found.");
          router.replace("/provider/myservices");
          return;
        }
        const data = snap.data();
        if (DEBUG) console.log("[EditService] fetched service:", data);
        setTitle(data.title || data.name || "");
        setCategory(data.category || "");
        setPrice(data.price ? String(data.price) : "");
        setDescription(data.description || "");
      } catch (err) {
        console.error("[EditService] fetch failed:", err);
        Alert.alert("Error", String(err));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [serviceId]);

  const save = async () => {
    if (!serviceId) {
      Alert.alert("Error", "No service selected.");
      return;
    }
    if (!title.trim()) {
      Alert.alert("Validation", "Please enter a title.");
      return;
    }
    setSaving(true);
    try {
      const ref = doc(db, "services", serviceId);
      await updateDoc(ref, {
        title: title.trim(),
        category: category || "",
        price: price ? String(price).trim() : "",
        description: description.trim(),
        updatedAt: new Date()
      });

      // success alert + redirect
      try {
        if (typeof window !== "undefined" && window.alert) window.alert("Saved — service updated.");
        else Alert.alert("Saved", "Service updated.");
      } catch (e) { /* ignore */ }

      // redirect to myservices
      if (typeof window !== "undefined" && window.location) {
        window.location.href = `${window.location.origin}/provider/myservices`;
      } else {
        router.replace("/provider/myservices");
      }
    } catch (err) {
      console.error("[EditService] save failed:", err);
      Alert.alert("Save failed", String(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading service...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Edit Service</Text>

      <Text style={styles.label}>Title</Text>
      <TextInput value={title} onChangeText={setTitle} placeholder="Service title" style={styles.input} />

      <Text style={styles.label}>Category</Text>
      <TextInput value={category} onChangeText={setCategory} placeholder="Category (e.g. Home Cleaning)" style={styles.input} />

      <Text style={styles.label}>Price (₹)</Text>
      <TextInput value={price} onChangeText={setPrice} placeholder="500" keyboardType="numeric" style={styles.input} />

      <Text style={styles.label}>Description</Text>
      <TextInput value={description} onChangeText={setDescription} placeholder="Optional" style={[styles.input, { height: 120 }]} multiline />

      <View style={{ height: 12 }} />
      {saving ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          <Button title="Save changes" onPress={save} />
          <View style={{ height: 8 }} />
          <Button title="Cancel" color="gray" onPress={() => router.replace("/provider/myservices")} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  label: { marginTop: 8, marginBottom: 6, fontWeight: "600" },
  input: { borderWidth: 1, padding: 10, borderRadius: 6, marginBottom: 6 }
});
