// app/register.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "expo-router";
<Text style={{
  fontSize: 28,
  fontWeight: "900",
  color: "#0a84ff",
  textAlign: "center",
  marginBottom: 20
}}>
  Markapuram Services


 style={{
  textAlign: "center",
  color: "#666",
  marginBottom: 20
}}
  Trusted local services at your doorstep
</Text>
/* ---------- ALERT HELPER (UNCHANGED) ---------- */
function showAlert(title, msg, onOk) {
  try {
    Alert.alert(title, msg, [{ text: "OK", onPress: onOk }], { cancelable: true });
  } catch (e) {}
  try {
    if (typeof window !== "undefined" && window.alert) {
      window.alert(title + "\n\n" + msg);
      if (onOk) onOk();
    }
  } catch (e) {}
}

/* ---------- COMPONENT ---------- */
export default function Register() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [loading, setLoading] = useState(false);

  const validateMarkapuram = (addr) => {
    if (!addr) return false;
    const a = addr.toLowerCase();
    return a.includes("markapur");
  };

  const handleRegister = async () => {
    if (!name || !phone || !address || !email || !password) {
      showAlert("Missing details", "Please fill all fields.");
      return;
    }

    if (!validateMarkapuram(address)) {
      showAlert(
        "Service area",
        "This app is only for Markapuram area."
      );
      return;
    }

    setLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      await setDoc(doc(db, "users", res.user.uid), {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        email: email.trim().toLowerCase(),
        role,
        createdAt: new Date().toISOString()
      });

      setLoading(false);
      showAlert("Success", "Account created successfully.", () =>
        router.replace("/login")
      );
    } catch (err) {
      setLoading(false);
      showAlert("Registration failed", err.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <Text style={styles.appName}>Markapuram Services</Text>
      <Text style={styles.subtitle}>Create your account</Text>

      {/* FORM CARD */}
      <View style={styles.card}>
        <TextInput placeholder="Full name" value={name} onChangeText={setName} style={styles.input} />
        <TextInput placeholder="Phone" value={phone} onChangeText={setPhone} style={styles.input} keyboardType="phone-pad" />
        <TextInput placeholder="Address (Markapuram)" value={address} onChangeText={setAddress} style={styles.input} />
        <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize="none" keyboardType="email-address" />
        <TextInput placeholder="Password (6+ chars)" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />

        {/* ROLE SELECTOR */}
        <Text style={styles.roleLabel}>I am a</Text>
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleBtn, role === "customer" && styles.roleActive]}
            onPress={() => setRole("customer")}
          >
            <Text style={role === "customer" ? styles.roleTextActive : styles.roleText}>
              Customer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleBtn, role === "provider" && styles.roleActive]}
            onPress={() => setRole("provider")}
          >
            <Text style={role === "provider" ? styles.roleTextActive : styles.roleText}>
              Provider
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <Button title="Create Account" onPress={handleRegister} />
        )}

        <TouchableOpacity onPress={() => router.replace("/login")}>
          <Text style={styles.loginLink}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f4f7",
    padding: 20,
    justifyContent: "center"
  },
  appName: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4
  },
  subtitle: {
    textAlign: "center",
    fontSize: 15,
    color: "#666",
    marginBottom: 20
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 5
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10
  },
  roleLabel: {
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 6
  },
  roleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14
  },
  roleBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    marginHorizontal: 4
  },
  roleActive: {
    backgroundColor: "#0a84ff",
    borderColor: "#0a84ff"
  },
  roleText: {
    color: "#333",
    fontWeight: "600"
  },
  roleTextActive: {
    color: "#fff",
    fontWeight: "700"
  },
  loginLink: {
    marginTop: 12,
    textAlign: "center",
    color: "#0a84ff",
    fontWeight: "600"
  }
});
