/* ═══════════════════════════════════════════════════════════
   WPSA 2026 · db.js  — Data Layer
   ───────────────────────────────────────────────────────────
   FIX-1  Uses FIREBASE_CONFIG (not hardcoded key)
   FIX-2  All missing methods added (getLogs, updateReg, etc.)
   FIX-3  saveReg uses .doc(id).set() — preserves WPSA26-XXX id
   FIX-4  All timestamps stored as ISO strings
   FIX-5  Collection is 'loginLogs' everywhere
   FIX-9  saveUser upserts, not push (no duplicates)
   ═══════════════════════════════════════════════════════════ */
'use strict';

const LS = {
  get:    k       => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set:    (k,v)   => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} },
  upsert: (k,id,patch) => {
    const a = LS.get(k)||[]; const i=a.findIndex(x=>x.id===id||x.uid===id);
    if(i>=0) a[i]={...a[i],...patch}; else a.push({...patch,id});
    LS.set(k,a);
  },
  remove: (k,id)  => { LS.set(k,(LS.get(k)||[]).filter(x=>x.id!==id&&x.uid!==id)); },
};

const DEFAULT_SETTINGS = () => ({
  sendAgenda:true, sendReceipt:true, pitchDeadline:'2026-05-15',
  confirmSubject:'Your WPSA 2026 Registration is Confirmed! 🎉',
  agendaText:`WPSA 2026 — Agenda\nDate: 23rd May 2026 | NSE, BKC Mumbai\n09:30 Registrations\n10:30 Opening Ceremony\n11:00 Fireside Chat\n11:30 Awards Set 1\n12:15 Panel 1\n01:00 Lunch & Networking\n02:00 Awards Set 2\n02:45 Panel 2\n03:30 PitchPower\n05:00 Awards Set 3\n05:30 Networking\nQueries: connect@billenniumdivas.fund`,
});

let _db=null, _auth=null, _ready=false, _done=false;

function _isConfigured() {
  try { return typeof FIREBASE_CONFIG!=='undefined' && FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.startsWith('YOUR_'); }
  catch { return false; }
}

function _init() {
  if (_done) return; _done=true;
  if (!_isConfigured()) { console.warn('[DB] Firebase not configured — using localStorage'); return; }
  try {
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG); // FIX-1: uses FIREBASE_CONFIG
    _db=firebase.firestore(); _auth=firebase.auth(); _ready=true;
    _db.enablePersistence({synchronizeTabs:true}).catch(()=>{});
    console.log('%c[DB] Firebase connected ✅','color:#4caf82;font-weight:bold');
  } catch(e) { console.error('[DB] init failed, using localStorage:',e.message); _ready=false; }
}

const DB = {
  isFirebase() { _init(); return _ready; },
  get auth()   { _init(); return _auth; },
  status()     { _init(); return { ready:_ready, backend:_ready?'Firebase Firestore':'localStorage (demo)' }; },

  /* REGISTRATIONS */
  async getRegs() {
    _init();
    if (_ready) {
      const s=await _db.collection('registrations').orderBy('timestamp','desc').get();
      return s.docs.map(d=>({...d.data(),id:d.id}));
    }
    return (LS.get('wpsa_regs')||[]).sort((a,b)=>b.timestamp>a.timestamp?1:-1);
  },
  async saveReg(reg) {  // FIX-3: .doc(id).set preserves WPSA26-XXX
    _init();
    const data={...reg, timestamp: typeof reg.timestamp==='string'?reg.timestamp:new Date().toISOString()}; // FIX-4
    if (_ready) await _db.collection('registrations').doc(data.id).set(data);
    else LS.upsert('wpsa_regs', data.id, data);
  },
  async updateReg(id,patch) {
    _init();
    if (_ready) await _db.collection('registrations').doc(id).update(patch);
    else LS.upsert('wpsa_regs', id, patch);
  },
  async deleteReg(id) {
    _init();
    if (_ready) await _db.collection('registrations').doc(id).delete();
    else LS.remove('wpsa_regs', id);
  },
  async getRegById(id) {
    _init();
    if (_ready) { const d=await _db.collection('registrations').doc(id).get(); return d.exists?{...d.data(),id:d.id}:null; }
    return (LS.get('wpsa_regs')||[]).find(r=>r.id===id)||null;
  },
  async getRegsByEmail(email) {
    _init(); const lc=(email||'').toLowerCase();
    if (_ready) { const s=await _db.collection('registrations').where('email','==',lc).get(); return s.docs.map(d=>({...d.data(),id:d.id})); }
    return (LS.get('wpsa_regs')||[]).filter(r=>(r.email||'').toLowerCase()===lc);
  },

  /* LOGS  — FIX-5: collection 'loginLogs' everywhere */
  async addLog(entry) {
    _init();
    const doc={...entry, timestamp:new Date().toISOString(), userAgent:navigator.userAgent.slice(0,120)}; // FIX-4
    if (_ready) await _db.collection('loginLogs').add(doc);
    else { const a=LS.get('wpsa_login_logs')||[]; a.unshift(doc); if(a.length>500)a.splice(500); LS.set('wpsa_login_logs',a); }
  },
  async getLogs() {
    _init();
    if (_ready) { const s=await _db.collection('loginLogs').orderBy('timestamp','desc').limit(500).get(); return s.docs.map(d=>({...d.data(),id:d.id})); }
    return LS.get('wpsa_login_logs')||[];
  },
  async clearLogs() {
    _init();
    if (_ready) { const s=await _db.collection('loginLogs').get(); const b=_db.batch(); s.docs.forEach(d=>b.delete(d.ref)); await b.commit(); }
    else LS.set('wpsa_login_logs',[]);
  },

  /* USERS  — FIX-9: upsert, not push */
  async getUsers() {
    _init();
    if (_ready) { const s=await _db.collection('users').orderBy('createdAt','desc').get(); return s.docs.map(d=>({...d.data(),uid:d.id})); }
    return LS.get('wpsa_users')||[];
  },
  async saveUser(user) {
    _init(); const uid=user.uid||user.email;
    if (_ready) await _db.collection('users').doc(uid).set(user,{merge:true});
    else {
      const a=LS.get('wpsa_users')||[]; const i=a.findIndex(u=>u.uid===uid||u.email===user.email);
      if(i>=0) a[i]={...a[i],...user}; else a.push({...user,uid}); LS.set('wpsa_users',a);
    }
  },
  async getUserByEmail(email) {
    _init(); const lc=(email||'').toLowerCase();
    if (_ready) { const s=await _db.collection('users').where('email','==',lc).limit(1).get(); if(s.empty) return null; const d=s.docs[0]; return{...d.data(),uid:d.id}; }
    return (LS.get('wpsa_users')||[]).find(u=>(u.email||'').toLowerCase()===lc)||null;
  },
  async deleteUser(uid) {
    _init();
    if (_ready) await _db.collection('users').doc(uid).delete();
    else LS.set('wpsa_users',(LS.get('wpsa_users')||[]).filter(u=>u.uid!==uid));
  },

  /* SETTINGS */
  async getSettings() {
    _init();
    if (_ready) { const d=await _db.collection('settings').doc('config').get(); return d.exists?d.data():DEFAULT_SETTINGS(); }
    return LS.get('wpsa_settings')||DEFAULT_SETTINGS();
  },
  async saveSettings(s) {
    _init();
    if (_ready) await _db.collection('settings').doc('config').set(s);
    else LS.set('wpsa_settings',s);
  },
};

window.DB=DB;
document.addEventListener('DOMContentLoaded',()=>{
  _init();
  const s=DB.status();
  console.log(`%c[DB] ${s.backend}`,`color:${s.ready?'#4caf82':'#f5a020'};font-weight:bold`);
});
