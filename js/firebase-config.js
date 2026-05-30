window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyBGlJauNHYgTqWobGKrMi1Qn9vvGfKpDTI",
  authDomain: "wpsa2026.firebaseapp.com",
  projectId: "wpsa2026",
  storageBucket: "wpsa2026.firebasestorage.app",
  messagingSenderId: "520552769766",
  appId: "1:520552769766:web:b9836ab33d03292c05f327",
  measurementId: "G-V8LK7CHGEJ",
};

/* FIX */
if (!firebase.apps.length) {
  firebase.initializeApp(window.FIREBASE_CONFIG);
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

window.auth = auth;
window.db = db;
window.storage = storage;

console.log("✅ Firebase initialized correctly");
