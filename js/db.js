/* ═══════════════════════════════════════════════════
   WPSA 2026 · db.js  — Unified Data Layer
   ───────────────────────────────────────────────────
   FIX-1  saveReg uses .doc(id).set() — preserves WPSA26-XXX id
   FIX-2  Single log collection: 'loginLogs' everywhere
   FIX-3  All timestamps stored as ISO strings
   FIX-4  Full localStorage fallback for every operation
   ═══════════════════════════════════════════════════ */

/* ── localStorage helper ── */
const LS = {
  get: (k) => {
    try {
      return JSON.parse(localStorage.getItem(k));
    } catch {
      return null;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  },
  upsert: (k, id, patch) => {
    const a = LS.get(k) || [];
    const i = a.findIndex((x) => x.id === id || x.uid === id);
    if (i >= 0) a[i] = { ...a[i], ...patch };
    else a.push({ ...patch, id });
    LS.set(k, a);
  },
  remove: (k, id) => {
    LS.set(
      k,
      (LS.get(k) || []).filter((x) => x.id !== id && x.uid !== id),
    );
  },
};

/* Default settings used when Firebase has no config doc yet */
const DEFAULT_SETTINGS = () => ({
  sendAgenda: true,
  sendReceipt: true,
  pitchDeadline: "2026-05-15",
  confirmSubject: "Your WPSA 2026 Registration is Confirmed! 🎉",
  agendaText:
    "WPSA 2026 — Event Agenda\n" +
    "─".repeat(44) +
    "\n" +
    "Date  : Saturday, 23rd May 2026\n" +
    "Time  : 09:30 AM – 06:00 PM IST\n" +
    "Venue : NSE, Bandra Kurla Complex, Mumbai\n" +
    "─".repeat(44) +
    "\n\n" +
    "09:30  Registrations & Welcome Tea\n" +
    "10:30  Opening Ceremony\n" +
    "11:00  Fireside Chat\n" +
    "11:30  Awards Ceremony — Set 1\n" +
    "12:15  Panel Discussion 1\n" +
    "13:00  Power Lunch & Networking\n" +
    "14:00  Awards Ceremony — Set 2\n" +
    "14:45  Panel Discussion 2\n" +
    "15:30  PitchPower Startup Pitches\n" +
    "17:00  Awards Ceremony — Set 3\n" +
    "17:30  Vote of Thanks & Networking\n\n" +
    "Queries: connect@billenniumdivas.fund",
});

/* ── Firebase internals ── */
let _db = null;
let _auth = null;
let _ready = false;
let _done = false;

function _isConfigured() {
  try {
    const cfg = window.FIREBASE_CONFIG;
    return !!(cfg && cfg.apiKey && !cfg.apiKey.startsWith("YOUR_"));
  } catch {
    return false;
  }
}

function _init() {
  if (_done) return;
  _done = true;

  if (!_isConfigured()) {
    console.warn(
      "[DB] Firebase not configured — using localStorage. Fill in js/firebase-config.js.",
    );
    return;
  }
  if (typeof firebase === "undefined") {
    console.error("[DB] Firebase SDK not loaded.");
    return;
  }

  try {
    if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
    _db = firebase.firestore();
    _auth = firebase.auth();
    _ready = true;
    _db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
    console.log(
      "%c[DB] Firebase Firestore connected ✅",
      "color:#4caf82;font-weight:bold",
    );
  } catch (e) {
    console.error("[DB] Init failed, falling back to localStorage:", e.message);
    _db = null;
    _auth = null;
    _ready = false;
  }
}

/* ══════════════════════════════════════════
   PUBLIC DB OBJECT
   ══════════════════════════════════════════ */
const DB = {
  isFirebase() {
    _init();
    return _ready;
  },
  get auth() {
    _init();
    return _auth;
  },
  status() {
    _init();
    return {
      ready: _ready,
      backend: _ready ? "Firebase Firestore" : "localStorage (demo)",
    };
  },

  /* ── REGISTRATIONS ── */

  async getRegs() {
    _init();
    if (_ready) {
      try {
        const snap = await _db
          .collection("registrations")
          .orderBy("timestamp", "desc")
          .get();
        return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      } catch (e) {
        console.error("[DB] getRegs failed:", e);
      }
    }
    /* FIX-4: localStorage fallback */
    return (LS.get("wpsa_regs") || []).sort((a, b) =>
      b.timestamp > a.timestamp ? 1 : -1,
    );
  },

  async saveReg(reg) {
    _init();
    /* FIX-1: .doc(id).set() preserves WPSA26-XXX id */
    /* FIX-3: ISO string timestamp */
    const data = {
      ...reg,
      timestamp: reg.timestamp || new Date().toISOString(),
    };
    if (_ready) {
      try {
        await _db.collection("registrations").doc(data.id).set(data);
        return data.id;
      } catch (e) {
        console.error("[DB] saveReg Firebase failed:", e);
      }
    }
    LS.upsert("wpsa_regs", data.id, data);
    return data.id;
  },

  async updateReg(id, patch) {
    _init();
    if (_ready) {
      try {
        await _db.collection("registrations").doc(id).update(patch);
        return;
      } catch (e) {
        console.error("[DB] updateReg failed:", e);
      }
    }
    LS.upsert("wpsa_regs", id, patch);
  },

  async deleteReg(id) {
    _init();
    if (_ready) {
      try {
        await _db.collection("registrations").doc(id).delete();
        return;
      } catch (e) {
        console.error("[DB] deleteReg failed:", e);
      }
    }
    LS.remove("wpsa_regs", id);
  },

  async getRegById(id) {
    _init();
    if (_ready) {
      try {
        const doc = await _db.collection("registrations").doc(id).get();
        return doc.exists ? { ...doc.data(), id: doc.id } : null;
      } catch (e) {
        console.error("[DB] getRegById failed:", e);
      }
    }
    return (LS.get("wpsa_regs") || []).find((r) => r.id === id) || null;
  },

  async getRegsByEmail(email) {
    _init();
    const lc = (email || "").toLowerCase();
    if (_ready) {
      try {
        const snap = await _db
          .collection("registrations")
          .where("email", "==", lc)
          .get();
        return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      } catch (e) {
        console.error("[DB] getRegsByEmail failed:", e);
      }
    }
    return (LS.get("wpsa_regs") || []).filter(
      (r) => (r.email || "").toLowerCase() === lc,
    );
  },

  /* ── LOGS  ──
     FIX-2: Single collection 'loginLogs' everywhere.
     Removed the separate global addLoginLog() — use DB.addLog() exclusively.  */

  async addLog(entry) {
    _init();
    /* FIX-3: ISO timestamp */
    const doc = {
      ...entry,
      timestamp: new Date().toISOString(),
      userAgent: (navigator.userAgent || "").slice(0, 120),
    };
    if (_ready) {
      try {
        await _db.collection("loginLogs").add(doc);
        return;
      } catch (e) {
        console.error("[DB] addLog failed:", e);
      }
    }
    const arr = LS.get("wpsa_login_logs") || [];
    arr.unshift(doc);
    if (arr.length > 500) arr.splice(500);
    LS.set("wpsa_login_logs", arr);
  },

  async getLogs() {
    _init();
    if (_ready) {
      try {
        const snap = await _db
          .collection("loginLogs")
          .orderBy("timestamp", "desc")
          .limit(500)
          .get();
        return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      } catch (e) {
        console.error("[DB] getLogs failed:", e);
      }
    }
    return LS.get("wpsa_login_logs") || [];
  },

  async clearLogs() {
    _init();
    if (_ready) {
      try {
        const snap = await _db.collection("loginLogs").get();
        const batch = _db.batch();
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        return;
      } catch (e) {
        console.error("[DB] clearLogs failed:", e);
      }
    }
    LS.set("wpsa_login_logs", []);
  },

  /* ── USERS ── */

  async getUsers() {
    _init();
    if (_ready) {
      try {
        const snap = await _db
          .collection("users")
          .orderBy("createdAt", "desc")
          .get();
        return snap.docs.map((d) => ({ ...d.data(), uid: d.id }));
      } catch (e) {
        console.error("[DB] getUsers failed:", e);
      }
    }
    return LS.get("wpsa_users") || [];
  },

  async getUserById(uid) {
    _init();

    if (_ready) {
      try {
        const doc = await _db.collection("users").doc(uid).get();

        return doc.exists ? { ...doc.data(), uid: doc.id } : null;
      } catch (e) {
        console.error("[DB] getUserById failed:", e);
      }
    }

    return null;
  },

  async saveUser(user) {
    _init();
    const uid = user.uid || user.email;
    if (_ready) {
      try {
        await _db
          .collection("users")
          .doc(uid)
          .set({ ...user, uid }, { merge: true });
        return;
      } catch (e) {
        console.error("[DB] saveUser failed:", e);
      }
    }
    const arr = LS.get("wpsa_users") || [];
    const i = arr.findIndex((u) => u.uid === uid || u.email === user.email);
    if (i >= 0) arr[i] = { ...arr[i], ...user, uid };
    else arr.push({ ...user, uid });
    LS.set("wpsa_users", arr);
  },

  async deleteUser(uid) {
    _init();
    if (_ready) {
      try {
        await _db.collection("users").doc(uid).delete();
        return;
      } catch (e) {
        console.error("[DB] deleteUser failed:", e);
      }
    }
    LS.set(
      "wpsa_users",
      (LS.get("wpsa_users") || []).filter((u) => u.uid !== uid),
    );
  },

  /* ── SETTINGS ── */

  async getSettings() {
    _init();
    if (_ready) {
      try {
        const doc = await _db.collection("settings").doc("main").get();
        return doc.exists
          ? { ...DEFAULT_SETTINGS(), ...doc.data() }
          : DEFAULT_SETTINGS();
      } catch (e) {
        console.error("[DB] getSettings failed:", e);
      }
    }
    return { ...DEFAULT_SETTINGS(), ...(LS.get("wpsa_settings") || {}) };
  },

  async saveSettings(s) {
    _init();
    if (_ready) {
      try {
        await _db.collection("settings").doc("main").set(s);
        return;
      } catch (e) {
        console.error("[DB] saveSettings failed:", e);
      }
    }
    LS.set("wpsa_settings", s);
  },
};

/* Expose globally and print status on load */
window.DB = DB;
document.addEventListener("DOMContentLoaded", () => {
  _init();
  const s = DB.status();
  console.log(
    `%c[DB] ${s.backend}`,
    `color:${s.ready ? "#4caf82" : "#f5a020"};font-weight:bold`,
  );
});

const pitchInput = document.getElementById("pitch-input");

pitchInput?.addEventListener("change", async (e) => {
  const files = [...e.target.files];

  const user = auth.currentUser;

  if (!user || !files.length) return;

  const status = document.getElementById("pitch-status");

  status.textContent = "Uploading...";

  try {
    for (const file of files) {
      const ref = storage
        .ref()
        .child(`pitch-decks/${user.uid}/${Date.now()}-${file.name}`);

      await ref.put(file);

      const url = await ref.getDownloadURL();

      await db.collection("pitch_submissions").add({
        uid: user.uid,
        email: user.email,
        fileName: file.name,
        fileUrl: url,
        uploadedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    }

    status.textContent = "Pitch uploaded successfully.";
  } catch (err) {
    console.error(err);

    status.textContent = "Upload failed.";
  }
});
