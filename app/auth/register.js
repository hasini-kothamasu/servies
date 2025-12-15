import React, { useState } from "react";
import { View, TextInput, Button, Text, Alert } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebaseConfig.js";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    if (!email || !password) return Alert.alert("Enter email and password");
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      Alert.alert("Account created. You will be redirected.");
    } catch (e) {
      Alert.alert("Register failed", e.message || String(e));
    }
  };

  return (
    <View style={{ flex:1, padding:20, justifyContent:"center" }}>
      <Text style={{fontSize:20, marginBottom:12}}>Register</Text>
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" autoCapitalize="none" style={{borderWidth:1,padding:8,marginBottom:8}} />
      <TextInput value={password} onChangeText={setPassword} placeholder="Password (6+)" secureTextEntry style={{borderWidth:1,padding:8,marginBottom:12}} />
      <Button title="Create Account" onPress={handleRegister} />
    </View>
  );
}
