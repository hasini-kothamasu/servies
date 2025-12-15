// app/login.js
import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  Text,
  Alert,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebaseConfig.js";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";

/**
 * Login screen
 * ⚠️ LOGIC COMPLETELY UNCHANGED
 * 🎨 UI POLISH ONLY
 */
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

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---------- ALERT (UNCHANGED) ---------- */
  const showAlert = (title, msg, onOk) => {
    try {
      if (typeof window !== "undefined" && window.alert) {
        window.alert(`${title}\n\n${msg || ""}`);
        if (onOk) onOk();
        return;
      }
    } catch (e) {}

    try {
      Alert.alert(title || "", msg || "", [{ text: "OK", onPress: onOk }], {
        cancelable: true
      });
    } catch (e) {
      console.log("[showAlert fallback]", title, msg);
      if (onOk) onOk();
    }
  };

  /* ---------- NAVIGATION (UNCHANGED) ---------- */
  const goTo = (path) => {
    try {
      if (typeof window !== "undefined" && window.location) {
        const target = window.location.origin + path;
        if (window.location.href !== target) window.location.href = target;
        return;
      }
    } catch (e) {}

    try {
      router.replace(path);
    } catch (e) {}
  };

  /* ---------- LOGIN LOGIC (UNCHANGED) ---------- */
  const handleLogin = async () => {
    const e = (email || "").trim().toLowerCase();
    const p = password || "";

    if (!e || !p) {
      showAlert("Missing fields", "Please enter both email and password.");
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      const res = await signInWithEmailAndPassword(auth, e, p);

      let role = null;
      try {
        const snap = await getDoc(doc(db, "users", res.user.uid));
        if (snap.exists()) role = snap.data()?.role || null;
      } catch (e) {}

      setLoading(false);
      showAlert("Signed in", `Welcome ${res.user.email}`, () => {
        if (role === "provider") goTo("/provider/dashboard");
        else goTo("/home");
      });
    } catch (err) {
      setLoading(false);

      const code = String(err?.code || "").toLowerCase();
      const msg = String(err?.message || "").toLowerCase();

      if (code.includes("wrong-password")) {
        showAlert("Wrong password", "The password is incorrect.");
        return;
      }
      if (code.includes("user-not-found") || msg.includes("no user record")) {
        showAlert("Account not found", "Create an account?", () =>
          goTo("/register")
        );
        return;
      }
      if (code.includes("too-many-requests")) {
        showAlert("Too many attempts", "Try again later.");
        return;
      }
      if (code.includes("network")) {
        showAlert("Network error", "Check your internet connection.");
        return;
      }

      showAlert("Login failed", err.message || "Unknown error");
    }
  };

  /* ---------- UI ---------- */
  return (
    <View style={styles.container}>
      {/* APP TITLE */}
      <Text style={styles.appName}>Markapuram Services</Text>
      <Text style={styles.subtitle}>Login to continue</Text>

      {/* LOGIN CARD */}
      <View style={styles.card}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email address"
          autoCapitalize="none"
          keyboardType="email-address"
          style={styles.input}
        />

        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          style={styles.input}
        />

        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <>
            <Button title="Login" onPress={handleLogin} />

            <TouchableOpacity onPress={() => goTo("/register")}>
              <Text style={styles.registerLink}>
                New here? Create an account
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f4f7",
    justifyContent: "center",
    padding: 20
  },
  appName: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6
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
    borderRadius: 10,
    padding: 12,
    marginBottom: 12
  },
  registerLink: {
    marginTop: 14,
    textAlign: "center",
    color: "#0a84ff",
    fontWeight: "600"
  }
});
