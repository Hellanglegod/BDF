/* ═══════════════════════════════════════════════════════════════
   WPSA 2026 · db.js
   ─────────────────────────────────────────────────────────────
   Single source of truth for ALL data operations.

   • When Firebase is configured → writes to Firestore (shared,
     multi-device, real-time, survives browser clears).
   • When Firebase is NOT configured (placeholder key) →
     falls back to localStorage so the demo still runs.

   Firestore collections
   ─────────────────────
     registrations/  {id}      → one doc per registration
     loginLogs/      {id}      → one doc per log event
     settings/       config    → single doc for organiser settings
     pitchFiles/     {regId}   → metadata about uploaded pitch files

   Exported async API (same names as the old localStorage helpers)
   ──────────────────────────────────────────────────────────────
     DB.getRegs()            → Registration[]
     DB.saveReg(reg)         → void
     DB.updateReg(id, patch) → void
     DB.deleteReg(id)        → void
     DB.getLogs()            → LogEntry[]
     DB.addLog(entry)        → void
     DB.clearLogs()          → void
     DB.getSettings()        → Settings
     DB.saveSettings(s)      → void
     DB.getUsers()           → User[]  (Firestore mirror of Firebase Auth)
     DB.saveUser(user)       → void
     DB.deleteUser(uid)      → void
   ═══════════════════════════════════════════════════════════════ */

'use strict';

function _firebaseReady() {
  return typeof firebase !== 'undefined' &&
         typeof FIREBASE_CONFIG !== 'undefined' &&
         FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY' &&
         FIREBASE_CONFIG.projectId !== 'YOUR_PROJECT_ID';
}

let _db = null;
let _auth = null;

function _init() {
  if (_db) return;
  
  if (!_firebaseReady()) {
    console.warn('[DB] Using localStorage fallback (Firebase not configured)');
    return;
  }

  try {
    // Initialize Firebase if not already done
    if (!firebase.apps.length) {
      firebase.initializeApp(FIREBASE_CONFIG);
      console.log('%c✅ Firebase App Initialized Successfully', 'color:#4caf50;font-weight:bold');
    }

    _db = firebase.firestore();
    _auth = firebase.auth();

    console.log('%c✅ Firestore & Auth Ready', 'color:#4caf50');

  } catch (e) {
    console.error('❌ Firebase Init Failed:', e);
    _db = null;
  }
}

const LS = { /* ... keep your existing LS helpers ... */ };

const DEFAULT_SETTINGS = () => ({ /* your existing default */ });

const DB = {
  isFirebase: () => _firebaseReady() && !!_db,

  async getRegs() {
    _init();
    if (_db) {
      const snap = await _db.collection('registrations').orderBy('timestamp', 'desc').get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return LS.get('wpsa_regs') || [];
  },

  // ... keep other methods but ensure they call _init() ...

  status() {
    _init();
    return {
      backend: _db ? 'Firebase Firestore (Shared)' : 'localStorage (Demo Only)',
      ready: !!_db,
    };
  }
};

window.DB = DB;