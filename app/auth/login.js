import React from "react";
import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";

export default function Login() {
  const router = useRouter();
  return (
    <View style={{flex:1,justifyContent:"center",padding:20}}>
      <Text style={{fontSize:20,marginBottom:12}}>Login (manual test)</Text>
      <Button title="Go to Main (manual)" onPress={() => router.push("/main/index")} />
    </View>
  );
}
