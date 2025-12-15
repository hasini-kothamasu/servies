// app/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAfwlGnvfokT7jvCbI9pblYx-LfhjnemCU",
  authDomain: "servies-70035.firebaseapp.com",
  projectId: "servies-70035",
  storageBucket: "servies-70035.firebasestorage.app",
  messagingSenderId: "903718976224",
  appId: "1:903718976224:web:5f19074e590b4adaf4ae85",
  measurementId: "G-RJ2J20QF50"
};

let app;
try { app = initializeApp(firebaseConfig); } catch (e) { /* ignore hot reload */ }

export const auth = getAuth(app);
export const db = getFirestore(app);
