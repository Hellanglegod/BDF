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

/* ── Detect whether Firebase is ready ── */
function _firebaseReady() {
  try {
    return (
      typeof firebase !== 'undefined' &&
      typeof FIREBASE_CONFIG !== 'undefined' &&
      FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY' &&
      FIREBASE_CONFIG.projectId !== 'YOUR_PROJECT_ID'
    );
  } catch { return false; }
}

/* ── Lazy-init Firebase app ── */
let _db  = null;
let _auth = null;
let _storage = null;

function _init() {
  if (_db) return;
  if (!_firebaseReady()) return;
  try {
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    _db      = firebase.firestore();
    _auth    = firebase.auth();
    _storage = firebase.storage ? firebase.storage() : null;

    /* Enable offline persistence so the app works on flaky connections */
    _db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
  } catch (e) {
    console.warn('[DB] Firebase init failed, using localStorage fallback:', e.message);
    _db = null;
  }
}

/* ════════════════════════════════════════════════
   LOCAL-STORAGE FALLBACK HELPERS
   ════════════════════════════════════════════════ */

const LS = {
  get: key => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
  push: (key, item) => {
    const arr = LS.get(key) || [];
    arr.push(item);
    LS.set(key, arr);
  },
  update: (key, id, patch) => {
    const arr = (LS.get(key) || []).map(x => x.id === id ? { ...x, ...patch } : x);
    LS.set(key, arr);
  },
  remove: (key, id) => {
    LS.set(key, (LS.get(key) || []).filter(x => x.id !== id));
  },
};

const DEFAULT_SETTINGS = () => ({
  sendAgenda:    true,
  sendReceipt:   true,
  pitchDeadline: '2026-05-15',
  confirmSubject:'Your WPSA 2026 Registration is Confirmed! 🎉',
  agendaText:
`WPSA 2026 — Event Agenda\n${'─'.repeat(44)}\nDate  : Saturday, 23rd May 2026\nTime  : 09:30 AM – 06:00 PM IST\nVenue : NSE, Bandra Kurla Complex, Mumbai\n${'─'.repeat(44)}\n\n09:30 AM  Registrations & Welcome Tea\n10:30 AM  Opening Ceremony\n10:35 AM  Keynote Address\n11:00 AM  Fireside Chat\n11:30 AM  Awards Ceremony — Set 1\n12:15 PM  Panel Discussion 1\n01:00 PM  Power Lunch & Networking\n02:00 PM  Awards Ceremony — Set 2\n02:45 PM  Panel Discussion 2\n03:30 PM  PitchPower Startup Pitches\n05:00 PM  Awards Ceremony — Set 3\n05:30 PM  Vote of Thanks & Networking\n\n${'─'.repeat(44)}\nQueries: connect@billenniumdivas.fund\n#WPSA2026 · #BreakFree · #BeThePower`,
});

/* ════════════════════════════════════════════════
   PUBLIC DB OBJECT
   ════════════════════════════════════════════════ */

const DB = {

  isFirebase: () => _firebaseReady() && !!_db,

  /* ── REGISTRATIONS ── */

  async getRegs() {
    _init();
    if (_db) {
      const snap = await _db.collection('registrations')
                             .orderBy('timestamp', 'desc')
                             .get();
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
    if (_db) {
      await _db.collection('registrations').doc(id).delete();
    } else {
      LS.remove('wpsa_regs', id);
    }
  },

  async getRegById(id) {
    _init();
    if (_db) {
      const doc = await _db.collection('registrations').doc(id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }
    return (LS.get('wpsa_regs') || []).find(r => r.id === id) || null;
  },

  async getRegsByEmail(email) {
    _init();
    const lc = email.toLowerCase();
    if (_db) {
      const snap = await _db.collection('registrations')
                             .where('email', '==', lc)
                             .get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return (LS.get('wpsa_regs') || []).filter(r => r.email?.toLowerCase() === lc);
  },

  /* ── LOGIN LOGS ── */

  async getLogs() {
    _init();
    if (_db) {
      const snap = await _db.collection('loginLogs')
                             .orderBy('timestamp', 'desc')
                             .limit(500)
                             .get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    return LS.get('wpsa_login_logs') || [];
  },

  async addLog(entry) {
    _init();
    const doc = {
      id:        'LOG-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent.slice(0, 120),
      ...entry,
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

  async clearLogs() {
    _init();
    if (_db) {
      const snap = await _db.collection('loginLogs').get();
      const batch = _db.batch();
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    } else {
      LS.set('wpsa_login_logs', []);
    }
  },

  /* ── SETTINGS ── */

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

  /* ── USERS (mirror of Firebase Auth profiles) ── */

  async getUsers() {
    _init();
    if (_db) {
      const snap = await _db.collection('users')
                             .orderBy('createdAt', 'desc')
                             .get();
      return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
    }
    return LS.get('wpsa_users') || [];
  },

  async saveUser(user) {
    _init();
    if (_db) {
      await _db.collection('users').doc(user.uid).set(user, { merge: true });
    } else {
      const arr = LS.get('wpsa_users') || [];
      const idx = arr.findIndex(u => u.uid === user.uid);
      if (idx >= 0) arr[idx] = { ...arr[idx], ...user }; else arr.push(user);
      LS.set('wpsa_users', arr);
    }
  },

  async getUserByEmail(email) {
    _init();
    const lc = email.toLowerCase();
    if (_db) {
      const snap = await _db.collection('users')
                             .where('email', '==', lc)
                             .limit(1)
                             .get();
      if (snap.empty) return null;
      const d = snap.docs[0];
      return { uid: d.id, ...d.data() };
    }
    return (LS.get('wpsa_users') || []).find(u => u.email?.toLowerCase() === lc) || null;
  },

  async deleteUser(uid) {
    _init();
    if (_db) {
      await _db.collection('users').doc(uid).delete();
    } else {
      const arr = (LS.get('wpsa_users') || []).filter(u => u.uid !== uid);
      LS.set('wpsa_users', arr);
    }
  },

  /* ── PITCH FILE METADATA ── */

  async savePitchMeta(regId, fileNames) {
    _init();
    const data = { regId, files: fileNames, updatedAt: new Date().toISOString() };
    if (_db) {
      await _db.collection('pitchFiles').doc(regId).set(data);
    }
    /* Always mirror to the registration record */
    await DB.updateReg(regId, { pitchFiles: fileNames });
  },

  /* ── FIREBASE AUTH HELPERS ── */

  get auth() { _init(); return _auth; },
  get storage() { _init(); return _storage; },
  get firestore() { _init(); return _db; },

  /* ── STATUS ── */

  status() {
    _init();
    return {
      backend:  _db  ? 'Firebase Firestore' : 'localStorage (demo)',
      auth:     _auth ? 'Firebase Auth'     : 'custom (demo)',
      storage:  _storage ? 'Firebase Storage' : 'in-memory only',
      ready:    !!_db,
    };
  },
};

/* Expose globally */
window.DB = DB;

/* Log backend status to console on load */
document.addEventListener('DOMContentLoaded', () => {
  _init();
  const s = DB.status();
  const style = s.ready
    ? 'color:#4caf82;font-weight:bold'
    : 'color:#f5a020;font-weight:bold';
  console.log(`%c[WPSA DB] Backend: ${s.backend}`, style);
  if (!s.ready) {
    console.log('%c[WPSA DB] To enable Firebase: fill in js/firebase-config.js', 'color:#c9952a');
  }
});