// app/provider/addservice.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity
} from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "../../firebaseConfig.js";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";

const CATEGORIES = {
  Appliances: ["AC Repair", "Washing Machine Repair", "Refrigerator Repair", "Geyser Repair", "Air Cooler Repair"],
  "Home Cleaning": ["Kitchen Cleaning", "Bathroom Cleaning", "Floor Cleaning", "Kitchen Deep Cleaning", "Bathroom Deep Cleaning", "Full Home Deep Cleaning", "Balcony Cleaning"],
  Beauty: ["Haircut", "Facial", "Hair Styling", "Makeup", "Saree Draping", "Mehendi", "Bridal Makeup"],
  Plumbing: ["Bathroom Plumbing", "Kitchen Plumbing", "Leakage Repair", "Pipe Fitting", "Tap Replacement", "New Fitting"],
  Electrical: ["New Installation", "Wiring Repair", "Bulb/Tube Replacement", "Fan Repair", "Inverter Repair", "Chimney Repair"],
  Cooking: ["Tiffin Service", "For 1 person", "For 2 persons", "For family of 4/5", "Party / Gathering (20-50 people)", "Festival / Special Occasion"]
};

export default function AddService() {
  const router = useRouter();
  const [uid, setUid] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(Object.keys(CATEGORIES)[0]);
  const [subservice, setSubservice] = useState(CATEGORIES[Object.keys(CATEGORIES)[0]][0]);
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u ? u.uid : null);
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    setSubservice(CATEGORIES[category][0]);
  }, [category]);

  const createService = async () => {
    if (!uid || !title.trim()) {
      Alert.alert("Missing info", "Please fill required fields");
      return;
    }

    setSaving(true);
    try {
      let providerName = "";
      let providerPhone = "";
      const profSnap = await getDoc(doc(db, "users", uid));
      if (profSnap.exists()) {
        providerName = profSnap.data().name || "";
        providerPhone = profSnap.data().phone || "";
      }

      await addDoc(collection(db, "services"), {
        providerId: uid,
        providerName,
        providerPhone,
        title: title.trim(),
        category,
        subservice,
        price: price.trim(),
        description: description.trim(),
        createdAt: serverTimestamp()
      });

      Alert.alert("Success", "Service added successfully!");
      router.replace("/provider/myservices");
    } catch (e) {
      Alert.alert("Error", String(e));
    } finally {
      setSaving(false);
    }
  };

  if (loadingAuth) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Checking account…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add New Service</Text>

      <Text style={styles.label}>Service Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} />

      <Text style={styles.label}>Category</Text>
      <View style={styles.chipWrap}>
        {Object.keys(CATEGORIES).map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, category === c && styles.chipActive]}
            onPress={() => setCategory(c)}
          >
            <Text style={category === c ? styles.chipTextActive : styles.chipText}>
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Service Type</Text>
      <View style={styles.chipWrap}>
        {CATEGORIES[category].map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, subservice === s && styles.chipActive]}
            onPress={() => setSubservice(s)}
          >
            <Text style={subservice === s ? styles.chipTextActive : styles.chipText}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Price (₹)</Text>
      <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" />

      <Text style={styles.label}>Description</Text>
      <TextInput style={[styles.input, { height: 90 }]} value={description} onChangeText={setDescription} multiline />

      {saving ? <ActivityIndicator size="large" /> : (
        <Button title="Add Service" onPress={createService} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex:1, justifyContent:"center", alignItems:"center" },
  container: { padding:16 },
  title: { fontSize:24, fontWeight:"800", marginBottom:16 },
  label: { fontWeight:"700", marginTop:12, marginBottom:6 },
  input: { borderWidth:1, borderRadius:10, padding:12, backgroundColor:"#fff" },
  chipWrap: { flexDirection:"row", flexWrap:"wrap" },
  chip: { paddingVertical:6, paddingHorizontal:12, borderRadius:20, borderWidth:1, margin:4 },
  chipActive: { backgroundColor:"#0a84ff", borderColor:"#0a84ff" },
  chipText: { color:"#000" },
  chipTextActive: { color:"#fff", fontWeight:"700" }
});
