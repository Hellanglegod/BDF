// js/firebase-config.js
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB61JauHNYgTqMobGKRM11Qn9vvGfKpDTI",
  authDomain: "wpsa2026.firebaseapp.com",
  projectId: "wpsa2026",
  storageBucket: "wpsa2026.firebasestorage.app",
  messagingSenderId: "520552769766",
  appId: "1:520552769766:web:b9836ab33d03292c05f327"
};

// Strong Admin Password - Change this before going live!
const ADMIN_PASS = "JIHANCEO";   

// Make them globally available
window.FIREBASE_CONFIG = FIREBASE_CONFIG;
window.ADMIN_PASS = ADMIN_PASS;

console.log('%c✅ firebase-config.js loaded successfully', 'color:#4caf50; font-weight:bold');