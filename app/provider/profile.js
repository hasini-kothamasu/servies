// app/provider/profile.js
import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, Alert, ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import { auth, db } from "../../firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "expo-router";

export default function ProviderProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uid, setUid] = useState(null);

  // profile fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [experience, setExperience] = useState(""); // years as string
  const [about, setAbout] = useState(""); // short bio
  const [skills, setSkills] = useState(""); // comma separated

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUid(null);
        setLoading(false);
        return;
      }
      setUid(u.uid);
      // load profile from users collection
      try {
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d = snap.data();
          setName(d.name || "");
          setPhone(d.phone || "");
          setAddress(d.address || "");
          setExperience(d.experience ? String(d.experience) : "");
          setAbout(d.about || "");
          setSkills((d.skills && Array.isArray(d.skills)) ? d.skills.join(", ") : (d.skills || ""));
        }
      } catch (e) {
        console.warn("[ProviderProfile] load error:", e);
        Alert.alert("Error", "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const validatePhone = (p) => {
    if (!p) return true;
    // simple numeric check (allow +)
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
        experience: experience ? Number(experience) || 0 : 0,
        about: about.trim(),
        // store skills as array
        skills: skills.split(",").map(s => s.trim()).filter(Boolean),
        role: "provider",
        updatedAt: serverTimestamp()
      };

      // merge into users doc (create if not exists)
      await setDoc(doc(db, "users", uid), payload, { merge: true });

      Alert.alert("Saved", "Profile updated successfully.");
      // optional: go back to provider dashboard
      // router.replace("/provider/dashboard");
    } catch (e) {
      console.error("[ProviderProfile] save failed:", e);
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
      <Text style={styles.title}>Provider Profile</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Full name" style={styles.input} />

      <Text style={styles.label}>Phone</Text>
      <TextInput value={phone} onChangeText={setPhone} placeholder="Phone number" keyboardType="phone-pad" style={styles.input} />

      <Text style={styles.label}>Address</Text>
      <TextInput value={address} onChangeText={setAddress} placeholder="Address" style={styles.input} />

      <Text style={styles.label}>Experience (years)</Text>
      <TextInput value={experience} onChangeText={setExperience} placeholder="e.g. 2" keyboardType="numeric" style={styles.input} />

      <Text style={styles.label}>Short bio / About</Text>
      <TextInput value={about} onChangeText={setAbout} placeholder="Brief description" multiline style={[styles.input, { height: 80 }]} />

      <Text style={styles.label}>Skills (comma separated)</Text>
      <TextInput value={skills} onChangeText={setSkills} placeholder="AC Repair, Wiring, Plumbing" style={styles.input} />

      <View style={{ height: 18 }} />

      {saving ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          <Button title="Save Profile" onPress={handleSave} />
          <View style={{ height: 12 }} />
          <Button title="Back to Dashboard" onPress={() => router.replace("/provider/dashboard")} />
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
