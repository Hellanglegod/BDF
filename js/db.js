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
    return {
      backend: _db ? 'Firebase' : 'LocalStorage',
      ready: !!_db
    };
  },

  /* USERS */

  async saveUser(user) {

    _init();

    if (!_db) return;

    await _db
      .collection("users")
      .doc(user.uid)
      .set(user);

  },

  async getUsers() {

    _init();

    if (!_db) return [];

    const snap = await _db
      .collection("users")
      .get();

    return snap.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));

  },

  async deleteUser(uid) {

    _init();

    if (!_db) return;

    await _db
      .collection("users")
      .doc(uid)
      .delete();

  },

  /* LOGS */

  async addLog(log) {

    _init();

    if (!_db) return;

    await _db
      .collection("logs")
      .add({
        ...log,
        timestamp: Date.now()
      });

  },

  async getLogs() {

    _init();

    if (!_db) return [];

    const snap = await _db
      .collection("logs")
      .orderBy("timestamp", "desc")
      .get();

    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

  },

  async clearLogs() {

    _init();

    if (!_db) return;

    const snap = await _db.collection("logs").get();

    const batch = _db.batch();

    snap.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

  },

  /* REGISTRATIONS */

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

    const doc = await _db
      .collection("registrations")
      .doc(id)
      .get();

    if (!doc.exists) return null;

    return {
      id: doc.id,
      ...doc.data()
    };

  },

  async saveReg(reg) {

    _init();

    if (!_db) return null;

    const ref = await _db
      .collection("registrations")
      .add({
        ...reg,
        timestamp: Date.now()
      });

    return ref.id;

  },

  async updateReg(id, data) {

    _init();

    if (!_db) return;

    await _db
      .collection("registrations")
      .doc(id)
      .update(data);

  },

  async deleteReg(id) {

    _init();

    if (!_db) return;

    await _db
      .collection("registrations")
      .doc(id)
      .delete();

  },

  /* SETTINGS */

  async getSettings() {

    _init();

    if (!_db) return {};

    const doc = await _db
      .collection("settings")
      .doc("main")
      .get();

    return doc.exists ? doc.data() : {};

  },

  async saveSettings(settings) {

    _init();

    if (!_db) return;

    await _db
      .collection("settings")
      .doc("main")
      .set(settings);

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

    await db.collection("loginLogs").add({
      email: email || "Unknown",
      type: type || "user",
      status: status || "success",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

  } catch (err) {
    console.error("Failed to save login log:", err);
  }
}

window.addLoginLog = addLoginLog;