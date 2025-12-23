import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyAfwlGnvfokT7jvCbI9pblYx-LfhjnemCU",
  authDomain: "servies-70035.firebaseapp.com",
  projectId: "servies-70035",
  storageBucket: "servies-70035.firebasestorage.app",
  messagingSenderId: "903718976224",
  appId: "1:903718976224:web:5f19074e590b4adaf4ae85",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);

