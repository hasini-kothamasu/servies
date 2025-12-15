import React from "react";
import { View, Text, Button, Alert } from "react-native";
import { Link } from "expo-router";
import { signOut } from "firebase/auth";
import { auth } from "../../firebaseConfig.js";

export default function Home() {
  return (
    <View style={{ flex:1, padding:20 }}>
      <Text style={{fontSize:22, marginBottom:12}}>Home</Text>
      <Link href="/main/subservices"><Text>Go to Subservices</Text></Link>
      <View style={{height:12}} />
      <Button title="Logout" onPress={() => signOut(auth).catch(e=>Alert.alert("Logout failed", String(e)))} />
    </View>
  );
}
