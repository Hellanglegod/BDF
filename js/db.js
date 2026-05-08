'use strict';

console.log('%c[DB] db.js loaded', 'color: orange');

// Immediate Firebase check
function _firebaseReady() {
  try {
    return (
      typeof firebase !== 'undefined' &&
      typeof FIREBASE_CONFIG !== 'undefined' &&
      FIREBASE_CONFIG.apiKey !=='AIzaSyBGlJauNHYgTqWobGKrMi1Qn9vvGfKpDTI'&& 
      FIREBASE_CONFIG.apiKey.length > 50 &&
      FIREBASE_CONFIG.projectId !== 'wpsa2026'
    );
  } catch(e) { return false; }
}

// Initialize immediately
let _db = null;
let _auth = null;

function _init() {
  if (_db) return;

  if (!_firebaseReady()) {
    console.warn('[DB] Firebase config missing or placeholder → Using localStorage');
    return;
  }

  try {
    if (firebase.apps.length === 0) {
      firebase.initializeApp(FIREBASE_CONFIG);
      console.log('%c✅ Firebase App Initialized Successfully!', 'color:#4caf50; font-weight:bold; font-size:15px');
    }
    _db = firebase.firestore();
    _auth = firebase.auth();
    console.log('%c✅ Firestore & Auth are READY', 'color:#4caf50');
  } catch (e) {
    console.error('❌ Firebase Init Error:', e.message);
  }
}

// Force init multiple times
_init();
setTimeout(_init, 100);
setTimeout(_init, 500);

// LocalStorage helpers...
const LS = {
  get: key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }},
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
  update: (key, id, patch) => {
    let arr = LS.get(key) || [];
    arr = arr.map(x => x.id === id ? {...x, ...patch} : x);
    LS.set(key, arr);
  },
  remove: (key, id) => {
    LS.set(key, (LS.get(key) || []).filter(x => x.id !== id));
  }
};

// ... rest of your DB object (getRegs, saveReg, etc.)

const DB = { /* keep all your existing methods */ };

window.DB = DB;

document.addEventListener('DOMContentLoaded', _init);