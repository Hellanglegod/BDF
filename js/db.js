'use strict';

console.log('%c[DB] db.js loaded', 'color: orange; font-weight: bold');

// ==================== CONFIG CHECK ====================
function _firebaseReady() {
  return typeof window.FIREBASE_CONFIG !== 'undefined' &&
         window.FIREBASE_CONFIG &&
         typeof window.FIREBASE_CONFIG.apiKey === 'string' &&
         window.FIREBASE_CONFIG.apiKey.length > 30;
}

let _db = null;
let _auth = null;

function _init() {
  if (_db) return;

  if (!_firebaseReady()) {
    console.warn('[DB] Firebase config missing or invalid → Using localStorage fallback');
    return;
  }

  try {
    if (firebase.apps.length === 0) {
      firebase.initializeApp(window.FIREBASE_CONFIG);
      console.log('%c✅ Firebase App Initialized Successfully!', 'color:#4caf50; font-weight:bold; font-size:15px');
    }

    _db = firebase.firestore();
    _auth = firebase.auth();

    console.log('%c✅ Firestore & Auth are READY', 'color:#4caf50; font-weight:bold');
  } catch (e) {
    console.error('❌ Firebase Init Failed:', e.message);
  }
}

// Force initialization
_init();
setTimeout(_init, 100);
setTimeout(_init, 500);

// ==================== LOCALSTORAGE FALLBACK ====================
const LS = {
  get: (key) => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }},
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
  update: (key, id, patch) => {
    let arr = LS.get(key) || [];
    arr = arr.map(x => x.id === id ? { ...x, ...patch } : x);
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
  agendaText: 'WPSA 2026 Agenda here...'
});

// ==================== MAIN DB API ====================
const DB = {
  isFirebase: () => _firebaseReady() && !!_db,

  async getRegs() { _init(); if (_db) { const s = await _db.collection('registrations').orderBy('timestamp','desc').get(); return s.docs.map(d=>({id:d.id,...d.data()})); } return LS.get('wpsa_regs') || []; },

  async saveReg(reg) { _init(); if (_db) await _db.collection('registrations').doc(reg.id).set(reg); else { const a=LS.get('wpsa_regs')||[]; const i=a.findIndex(r=>r.id===reg.id); if(i>=0)a[i]=reg; else a.push(reg); LS.set('wpsa_regs',a); }},

  async updateReg(id, patch) { _init(); if (_db) await _db.collection('registrations').doc(id).update(patch); else LS.update('wpsa_regs',id,patch); },

  async getLogs() { _init(); if (_db) { const s = await _db.collection('loginLogs').orderBy('timestamp','desc').limit(500).get(); return s.docs.map(d=>({id:d.id,...d.data()})); } return LS.get('wpsa_login_logs') || []; },

  async addLog(entry) { _init(); const doc = { id: 'LOG-'+Date.now()+'-'+Math.random().toString(36).slice(2,6), timestamp: new Date().toISOString(), ...entry }; if (_db) await _db.collection('loginLogs').doc(doc.id).set(doc); else { const a=LS.get('wpsa_login_logs')||[]; a.unshift(doc); if(a.length>500)a.splice(500); LS.set('wpsa_login_logs',a); }},

  async getSettings() { _init(); if (_db) { const d=await _db.collection('settings').doc('config').get(); return d.exists ? d.data() : DEFAULT_SETTINGS(); } return LS.get('wpsa_settings') || DEFAULT_SETTINGS(); },

  async saveSettings(s) { _init(); if (_db) await _db.collection('settings').doc('config').set(s); else LS.set('wpsa_settings', s); },

  status() { _init(); return { backend: _db ? 'Firebase Firestore' : 'localStorage', ready: !!_db }; }
};

window.DB = DB;

// Auto init
document.addEventListener('DOMContentLoaded', _init);