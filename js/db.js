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

  async saveUser(user) {

    _init();

    if (_db) {

      await _db
        .collection("users")
        .doc(user.uid)
        .set(user);

    }

  },

  async addLog(log) {

    _init();

    if (_db) {

      await _db
        .collection("logs")
        .add({
          ...log,
          timestamp: Date.now()
        });

    }

  },

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

  async deleteReg(id) {

    _init();

    if (!_db) return;

    await _db
      .collection("registrations")
      .doc(id)
      .delete();

  }

};


/* =========================
   Initialize Immediately
========================= */

_init();