// app/debug/deleteTest.js
import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert, ActivityIndicator, StyleSheet } from "react-native";
import { auth, db } from "../../firebaseConfig.js";
import { doc, getDoc, deleteDoc } from "firebase/firestore";

export default function DeleteTest() {
  const [id, setId] = useState("");
  const [busy, setBusy] = useState(false);

  const show = (t, m) => {
    try { Alert.alert(t, m); } catch (e) {}
    try { if (typeof window !== "undefined" && window.alert) window.alert(t + "\n\n" + m); } catch (e) {}
    console.log("[DeleteTest]", t, m);
  };

  const doCheckAndDelete = async () => {
    if (!id.trim()) return show("Input missing", "Enter service document ID to delete (copy from Firestore).");
    setBusy(true);

    try {
      const u = auth.currentUser;
      show("Auth check", `currentUser: ${u ? u.uid : "null (not signed in)"}\nemail: ${u ? u.email : "-"}`);
      console.log("[DeleteTest] attempting getDoc for id:", id);

      const ref = doc(db, "services", id.trim());
      const snap = await getDoc(ref);
      console.log("[DeleteTest] getDoc snap:", snap.exists(), snap && snap.data ? snap.data() : null);

      if (!snap.exists()) {
        show("Not found", "Document does not exist. It may already be deleted.");
        setBusy(false);
        return;
      }

      const serverProviderId = snap.data().providerId;
      show("Found", `providerId on doc: ${serverProviderId}`);
      console.log("[DeleteTest] serverProviderId:", serverProviderId);

      // attempt delete
      try {
        await deleteDoc(ref);
        show("Deleted", `deleteDoc succeeded for id: ${id}`);
        console.log("[DeleteTest] deleteDoc succeeded for id:", id);
      } catch (delErr) {
        console.error("[DeleteTest] deleteDoc failed:", delErr);
        show("Delete failed", String(delErr));
      }
    } catch (err) {
      console.error("[DeleteTest] overall failed:", err);
      show("Error", String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug: Delete service doc (manual)</Text>
      <Text style={{marginTop:8}}>1) Sign in with the provider account in the app (so auth.currentUser is provider). 2) Paste a service doc id below (copy from Firestore). 3) Press Delete.</Text>

      <TextInput
        value={id}
        onChangeText={setId}
        placeholder="Enter service document id (ex: dDkjiYbo2sP4D79sYsxW)"
        style={styles.input}
        autoCapitalize="none"
      />

      {busy ? (
        <ActivityIndicator style={{marginTop:12}} size="large" />
      ) : (
        <View style={{marginTop:12}}>
          <Button title="Check & Delete" onPress={doCheckAndDelete} />
          <View style={{height:10}} />
          <Button title="Open services in Firestore console" onPress={() => {
            try { window.open("https://console.firebase.google.com/project/servies-70035/firestore/data"); } catch(e) {}
          }} />
        </View>
      )}

      <View style={{height:18}} />
      <Text style={{fontSize:12, color:"#666"}}>Console logs will print to browser DevTools (Console). Alerts will also show.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:16 },
  title: { fontSize:18, fontWeight:"700", marginBottom:8 },
  input: { borderWidth:1, padding:10, borderRadius:6, marginTop:8 }
});
