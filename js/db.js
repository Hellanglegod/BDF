'use strict';

/* =============================================
   WPSA 2026 · db.js - Firebase + localStorage fallback
   ============================================= */

function _firebaseReady() {
  try {
    return (
      typeof firebase !== 'undefined' &&
      typeof FIREBASE_CONFIG !== 'undefined' &&
      typeof FIREBASE_CONFIG.apiKey === 'string' &&
      FIREBASE_CONFIG.apiKey.length > 30 &&                    // Real apiKey is long
      FIREBASE_CONFIG.projectId &&
      FIREBASE_CONFIG.projectId !== 'YOUR_PROJECT_ID' &&
      FIREBASE_CONFIG.projectId !== ''
    );
  } catch (e) {
    return false;
  }
}

let _db = null;
let _auth = null;

function _init() {
  if (_db) return;

  if (!_firebaseReady()) {
    console.warn('[DB] Firebase not configured → Using localStorage fallback');
    return;
  }

  try {
    if (firebase.apps.length === 0) {
      firebase.initializeApp(FIREBASE_CONFIG);
      console.log('%c✅ Firebase App Initialized Successfully', 'color:#4caf50;font-weight:bold');
    }

    _db = firebase.firestore();
    _auth = firebase.auth();

    // Enable offline persistence
    _db.enablePersistence({ synchronizeTabs: true }).catch(() => {});

    console.log('%c✅ Firestore & Auth Ready', 'color:#4caf50');
  } catch (e) {
    console.error('❌ Firebase Initialization Failed:', e.message);
    _db = null;
  }
}

// Force initialization on script load
setTimeout(_init, 50);

/* =============================================
   LOCALSTORAGE FALLBACK
   ============================================= */

const LS = {
  get: (key) => {
    try { return JSON.parse(localStorage.getItem(key) || 'null'); } 
    catch { return null; }
  },
  set: (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  },
  update: (key, id, patch) => {
    const arr = (LS.get(key) || []).map(x => x.id === id ? { ...x, ...patch } : x);
    LS.set(key, arr);
  },
  remove: (key, id) => {
    LS.set(key, (LS.get(key) || []).filter(x => x.id !== id));
  }
};

const DEFAULT_SETTINGS = () => ({
  sendAgenda: true,
  sendReceipt: true,
  pitchDeadline: '2026-05-15',
  confirmSubject: 'Your WPSA 2026 Registration is Confirmed! 🎉',
  agendaText: `WPSA 2026 — Event Agenda\n${'─'.repeat(44)}\nDate   : Saturday, 23rd May 2026\nTime   : 09:30 AM – 06:00 PM IST\nVenue  : NSE, Bandra Kurla Complex, Mumbai\n${'─'.repeat(44)}\n\n... (your agenda text) ...`
});

/* =============================================
   PUBLIC DB API
   ============================================= */

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

  async saveReg(reg) {
    _init();
    if (_db) {
      await _db.collection('registrations').doc(reg.id).set(reg);
    } else {
      const arr = LS.get('wpsa_regs') || [];
      const idx = arr.findIndex(r => r.id === reg.id);
      if (idx >= 0) arr[idx] = reg; else arr.push(reg);
      LS.set('wpsa_regs', arr);
    }
  },

  async updateReg(id, patch) {
    _init();
    if (_db) {
      await _db.collection('registrations').doc(id).update(patch);
    } else {
      LS.update('wpsa_regs', id, patch);
    }
  },

  async deleteReg(id) {
    _init();
    if (_db) await _db.collection('registrations').doc(id).delete();
    else LS.remove('wpsa_regs', id);
  },

  async getLogs() {
    _init();
    if (_db) {
      const snap = await _db.collection('loginLogs').orderBy('timestamp', 'desc').limit(500).get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return LS.get('wpsa_login_logs') || [];
  },

  async addLog(entry) {
    _init();
    const doc = {
      id: 'LOG-' + Date.now() + '-' + Math.random().toString(36).slice(2,6),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent.slice(0, 120),
      ...entry
    };
    if (_db) {
      await _db.collection('loginLogs').doc(doc.id).set(doc);
    } else {
      const arr = LS.get('wpsa_login_logs') || [];
      arr.unshift(doc);
      if (arr.length > 500) arr.splice(500);
      LS.set('wpsa_login_logs', arr);
    }
  },

  async getSettings() {
    _init();
    if (_db) {
      const doc = await _db.collection('settings').doc('config').get();
      return doc.exists ? doc.data() : DEFAULT_SETTINGS();
    }
    return LS.get('wpsa_settings') || DEFAULT_SETTINGS();
  },

  async saveSettings(s) {
    _init();
    if (_db) {
      await _db.collection('settings').doc('config').set(s);
    } else {
      LS.set('wpsa_settings', s);
    }
  },

  status() {
    _init();
    return {
      backend: _db ? 'Firebase Firestore (Live)' : 'localStorage (Demo)',
      ready: !!_db
    };
  }
};

window.DB = DB;

// Auto init on load
document.addEventListener('DOMContentLoaded', () => {
  _init();
});