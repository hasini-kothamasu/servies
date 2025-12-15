import React from "react";
import { View, Text, Button } from "react-native";
import { Link } from "expo-router";

export default function Subservices() {
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 12 }}>Subservices</Text>

      <View style={{ marginVertical: 6 }}>
        <Text>Plumbing</Text>
        <Link href="(main)/booking">Book Plumbing</Link>
      </View>

      <View style={{ marginVertical: 6 }}>
        <Text>Electrician</Text>
        <Link href="(main)/booking">Book Electrician</Link>
      </View>

      <View style={{ marginVertical: 6 }}>
        <Text>Carpentry</Text>
        <Link href="(main)/booking">Book Carpentry</Link>
      </View>

      <Button title="Back to Home" onPress={() => {}} />
    </View>
  );
}
