/* =========================
   Local Storage
========================= */

const LS = {

  get(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  },

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

};


/* =========================
   Firebase Globals
========================= */

let _db = null;
let _auth = null;
let _firebaseInitTried = false;


/* =========================
   Firebase Init
========================= */

function _init() {

  if (_firebaseInitTried) return;

  _firebaseInitTried = true;

  try {

    console.log("CONFIG:", window.FIREBASE_CONFIG);

    if (typeof firebase === "undefined") {
      console.error("Firebase SDK missing");
      return;
    }

    if (typeof window.FIREBASE_CONFIG === "undefined") {
      console.error("Firebase config missing");
      return;
    }

    firebase.initializeApp(window.FIREBASE_CONFIG);

    console.log("Firebase initialized");

    _db = firebase.firestore();
    _auth = firebase.auth();

  } catch (err) {

    console.error("Firebase init failed:", err);

  }

}


/* =========================
   Database API
========================= */

const DB = {

  isFirebase() {
    _init();
    return !!_db;
  },

  get auth() {
    _init();
    return _auth;
  },

  status() {
    _init();
    return {
      backend: _db ? 'Firebase' : 'localStorage',
      ready: !!_db
    };
  },

  /* ── Users ── */

  async saveUser(user) {
    _init();
    if (_db) {
      await _db.collection("users").doc(user.uid).set(user);
    }
  },

  async getUsers() {
    _init();
    if (!_db) return [];
    try {
      const snap = await _db.collection("users").get();
      return snap.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    } catch (err) {
      console.error("getUsers failed:", err);
      return [];
    }
  },

  async deleteUser(uid) {
    _init();
    if (!_db) return;
    await _db.collection("users").doc(uid).delete();
  },

  /* ── Logs ── */

  async addLog(log) {
    _init();
    if (_db) {
      await _db.collection("logs").add({
        ...log,
        timestamp: Date.now()
      });
    }
  },

  async getLogs() {
    _init();
    if (!_db) return [];
    try {
      const snap = await _db
        .collection("logs")
        .orderBy("timestamp", "desc")
        .limit(500)
        .get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error("getLogs failed:", err);
      return [];
    }
  },

  async clearLogs() {
    _init();
    if (!_db) return;
    try {
      const snap = await _db.collection("logs").get();
      const batch = _db.batch();
      snap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    } catch (err) {
      console.error("clearLogs failed:", err);
    }
  },

  /* ── Registrations ── */

  async getRegs() {
    _init();
    if (!_db) return [];
    const snap = await _db
      .collection("registrations")
      .orderBy("timestamp", "desc")
      .get();
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  async getRegById(id) {
    _init();
    if (!_db) return null;
    try {
      const doc = await _db.collection("registrations").doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    } catch (err) {
      console.error("getRegById failed:", err);
      return null;
    }
  },

  async saveReg(reg) {
    _init();
    if (!_db) return null;
    const ref = await _db.collection("registrations").add({
      ...reg,
      timestamp: Date.now()
    });
    return ref.id;
  },

  async updateReg(id, patch) {
    _init();
    if (!_db) return;
    await _db.collection("registrations").doc(id).update(patch);
  },

  async deleteReg(id) {
    _init();
    if (!_db) return;
    await _db.collection("registrations").doc(id).delete();
  },

  /* ── Settings ── */

  async getSettings() {
    _init();
    if (!_db) return {};
    try {
      const doc = await _db.collection("settings").doc("global").get();
      return doc.exists ? doc.data() : {};
    } catch (err) {
      console.error("getSettings failed:", err);
      return {};
    }
  },

  async saveSettings(settings) {
    _init();
    if (!_db) return;
    await _db.collection("settings").doc("global").set(settings, { merge: true });
  }

};


/* =========================
   Initialize Immediately
========================= */

_init();

async function addLoginLog(email, type, status) {

  try {

    if (!firebase.apps.length) return;

    const db = firebase.firestore();

    await db.collection("logs").add({
      email: email || "Unknown",
      action: type || "user_login",
      status: status || "success",
      timestamp: Date.now()
    });

  } catch (err) {
    console.error("Failed to save login log:", err);
  }
}

window.addLoginLog = addLoginLog;
