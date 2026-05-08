/* =========================
   LocalStorage helper
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
   Firebase internals
========================= */
let _db = null;
let _auth = null;
let _firebaseInitTried = false;

function _firebaseReady() {
  return typeof firebase !== 'undefined';
}

function _init() {
  if (_firebaseInitTried) return;

  _firebaseInitTried = true;

  try {
    if (_firebaseReady()) {

      // ONLY initialize if not already initialized
      if (!firebase.apps.length) {

        firebase.initializeApp({
          // For Firebase JS SDK v720.0 and later, measurementId is optional
  apiKey: "AIzaSyBGlJauNHYgTqWobGKrMi1Qn9vvGfKpDTI",
  authDomain: "wpsa2026.firebaseapp.com",
  projectId: "wpsa2026",
  storageBucket: "wpsa2026.firebasestorage.app",
  messagingSenderId: "520552769766",
  appId: "1:520552769766:web:b9836ab33d03292c05f327",
  measurementId: "G-V8LK7CHGEJ"
        });

      }

      _db = firebase.firestore();
      _auth = firebase.auth();

      console.log("Firebase initialized successfully");
    }
  } catch (err) {
    console.error("Firebase init failed:", err);
  }
}

/* =========================
   Database API
========================= */
const DB = {

  /* Firebase status */
  isFirebase() {
    _init();
    return !!_db;
  },

  /* Auth instance FIX */
  get auth() {
    _init();
    return _auth;
  },

  /* Save User FIX */
  async saveUser(user) {
    _init();

    if (_db) {

      await _db
        .collection('users')
        .doc(user.uid)
        .set(user);

    } else {

      const users = LS.get('wpsa_users') || [];

      users.push(user);

      LS.set('wpsa_users', users);
    }
  },

  /* Registrations */
  async getRegs() {
    _init();

    if (_db) {

      const snap = await _db
        .collection('registrations')
        .orderBy('timestamp', 'desc')
        .get();

      return snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    }

    return LS.get('wpsa_regs') || [];
  },

  async saveReg(reg) {
    _init();

    if (_db) {

      const ref = await _db
        .collection('registrations')
        .add({
          ...reg,
          timestamp: Date.now()
        });

      return ref.id;

    }

    const regs = LS.get('wpsa_regs') || [];

    reg.id = Date.now().toString();

    regs.unshift(reg);

    LS.set('wpsa_regs', regs);

    return reg.id;
  },

  async deleteReg(id) {
    _init();

    if (_db) {

      await _db
        .collection('registrations')
        .doc(id)
        .delete();

      return;
    }

    let regs = LS.get('wpsa_regs') || [];

    regs = regs.filter(r => r.id !== id);

    LS.set('wpsa_regs', regs);
  }
};