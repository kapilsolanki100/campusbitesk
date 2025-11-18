// firebase.js - Firebase v9.23.0 (modular)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD_E4uKPS_0uxmx1wMTm3jGikBgf7HwiYY",
  authDomain: "campusbites-4e430.firebaseapp.com",
  projectId: "campusbites-4e430",
  storageBucket: "campusbites-4e430.appspot.com",   // FIXED: correct ending is .appspot.com
  messagingSenderId: "897068032498",
  appId: "1:897068032498:web:7a28767d0c8c7b85610b6b",
  measurementId: "G-NFEK422PTC"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Firestore
export const db = getFirestore(app);
