// app/customer/profile.js
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, Alert, ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { auth, db } from "../../firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "expo-router";

export default function CustomerProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uid, setUid] = useState(null);

  // profile fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUid(null);
        setLoading(false);
        return;
      }
      setUid(u.uid);
      try {
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d = snap.data();
          setName(d.name || "");
          setPhone(d.phone || "");
          setAddress(d.address || "");
          setLandmark(d.landmark || "");
          setNotes(d.notes || "");
        }
      } catch (e) {
        console.warn("[CustomerProfile] load error:", e);
        Alert.alert("Error", "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const validatePhone = (p) => {
    if (!p) return true;
    return /^[+0-9\- ]{6,20}$/.test(p);
  };

  const handleSave = async () => {
    if (!uid) {
      Alert.alert("Not signed in", "Please sign in to save profile.");
      return;
    }
    if (!name.trim()) {
      Alert.alert("Validation", "Please enter your name.");
      return;
    }
    if (!validatePhone(phone)) {
      Alert.alert("Validation", "Enter a valid phone number.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        landmark: landmark.trim(),
        notes: notes.trim(),
        role: "customer",
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, "users", uid), payload, { merge: true });

      Alert.alert("Saved", "Profile updated successfully.");
    } catch (e) {
      console.error("[CustomerProfile] save failed:", e);
      Alert.alert("Save failed", String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Customer Profile</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Full name" style={styles.input} />

      <Text style={styles.label}>Phone</Text>
      <TextInput value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" style={styles.input} />

      <Text style={styles.label}>Address</Text>
      <TextInput value={address} onChangeText={setAddress} placeholder="House / Street / Area" style={styles.input} />

      <Text style={styles.label}>Landmark</Text>
      <TextInput value={landmark} onChangeText={setLandmark} placeholder="Nearby landmark" style={styles.input} />

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput value={notes} onChangeText={setNotes} placeholder="Any notes for the provider" multiline style={[styles.input, { height: 80 }]} />

      <View style={{ height: 18 }} />

      {saving ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          <Button title="Save Profile" onPress={handleSave} />
          <View style={{ height: 12 }} />
          <Button title="Back to Home" onPress={() => router.replace("/home")} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  label: { marginTop: 8, marginBottom: 4, fontWeight: "600" },
  input: { borderWidth: 1, padding: 10, borderRadius: 6, marginBottom: 8, backgroundColor: "white" }
});
