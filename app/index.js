// app/index.js
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { useRouter } from "expo-router";

export default function IndexRedirect() {
  const router = useRouter();

  useEffect(() => {
    const go = () => {
      const path = "/login";
      if (Platform.OS === "web" && typeof window !== "undefined") {
        // direct navigation for web so root opens /login
        const target = window.location.origin + path;
        if (window.location.href !== target) window.location.href = target;
      } else {
        router.replace(path);
      }
    };
    // small delay to allow router to init
    const t = setTimeout(go, 80);
    return () => clearTimeout(t);
  }, []);

  return null;
}
