/* ═══════════════════════════════════════════════
   WPSA 2026 · admin.js
   Organiser Panel — standalone admin.html only
   ═══════════════════════════════════════════════ */
'use strict';

const ADMIN_PASS = 'wpsa2026@admin';

const TICKET_LABELS = {
  award:    'Award Nomination',
  delegate: 'Delegate Pass',
  startup:  'PitchPower',
};

function getRegs()        { return JSON.parse(localStorage.getItem('wpsa_regs')        || '[]'); }
function saveRegs(r)      { localStorage.setItem('wpsa_regs', JSON.stringify(r)); }
function getSettings()    { return JSON.parse(localStorage.getItem('wpsa_settings')    || 'null') || defaultSettings(); }
function saveSettings(s)  { localStorage.setItem('wpsa_settings', JSON.stringify(s)); }
function getLoginLogs()   { return JSON.parse(localStorage.getItem('wpsa_login_logs')  || '[]'); }
function saveLoginLogs(l) { localStorage.setItem('wpsa_login_logs', JSON.stringify(l)); }

function recordLoginEvent(email, type, status) {
  const logs = getLoginLogs();
  logs.unshift({ email, type, status, timestamp: new Date().toISOString() });
  if (logs.length > 500) logs.splice(500);
  saveLoginLogs(logs);
}

function defaultSettings() {
  return {
    sendAgenda:   true,
    sendReceipt:  true,
    pitchDeadline:'2026-05-15',
    confirmSubject:'Your WPSA 2026 Registration is Confirmed! 🎉',
    agendaText:`WPSA 2026 — Event Agenda\n${'─'.repeat(44)}\nDate   : Saturday, 23rd May 2026\nTime   : 09:30 AM – 06:00 PM IST\nVenue  : NSE, Bandra Kurla Complex, Mumbai\n${'─'.repeat(44)}\n\n09:30 AM  Registrations & Welcome Tea\n10:30 AM  Opening Ceremony & Lamp Lighting\n10:35 AM  Keynote Address\n11:00 AM  Fireside Chat\n11:30 AM  Awards Ceremony — Set 1\n12:15 PM  Panel Discussion 1\n01:00 PM  Power Lunch & Networking\n02:00 PM  Awards Ceremony — Set 2\n02:45 PM  Panel Discussion 2\n03:30 PM  PitchPower Startup Pitches\n05:00 PM  Awards Ceremony — Set 3\n05:30 PM  Vote of Thanks & Power Networking\n\n${'─'.repeat(44)}\nFor queries: connect@billenniumdivas.fund`,
  };
}

/* ── LOGIN ── */
let adminLoggedIn = false;

function tryLogin() {
  const pass = document.getElementById('login-pass').value;
  const err  = document.getElementById('login-err');
  if (pass === ADMIN_PASS) {
    recordLoginEvent('admin', 'admin', 'success');
    adminLoggedIn = true;
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-app').style.display = 'block';
    loadDashboard();
  } else {
    recordLoginEvent('admin', 'admin', 'failed');
    err.textContent = 'Incorrect password. Please try again.';
    err.style.display = 'block';
    document.getElementById('login-pass').value = '';
    document.getElementById('login-pass').focus();
  }
}

/* ── TABS ── */
let activeTab = 'registrations';
function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.atab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.querySelectorAll('.apane').forEach(p => p.classList.toggle('active', p.id === 'pane-' + tab));
  if (tab === 'pitches')    renderPitchTable();
  if (tab === 'checkin')    resetCheckinSearch();
  if (tab === 'settings')   loadSettings();
  if (tab === 'loginlogs')  renderLoginLogsTable();
}

/* ── DASHBOARD / STATS ── */
let currentFilter = 'all';
let currentSearch = '';

function loadDashboard() {
  const regs = getRegs();
  const total    = regs.length;
  const revenue  = regs.reduce((s, r) => s + (r.amount || 0), 0);
  const checkins = regs.filter(r => r.checkedIn).length;
  const awards   = regs.filter(r => r.ticket === 'award').length;
  const delegates = regs.filter(r => r.ticket === 'delegate').length;
  const startups = regs.filter(r => r.ticket === 'startup').length;

  const s = id => document.getElementById(id);
  s('st-total').textContent    = total;
  s('st-revenue').textContent  = '₹' + revenue.toLocaleString('en-IN');
  s('st-checkin').textContent  = checkins;
  s('st-award').textContent    = awards;
  s('st-delegate').textContent = delegates;
  s('st-startup').textContent  = startups;
  s('st-pct').textContent      = total > 0 ? Math.round(checkins / total * 100) + '%' : '0%';

  renderTable();
}

function renderTable() {
  const tbody = document.getElementById('reg-tbody');
  if (!tbody) return;
  let data = getRegs();

  if (currentFilter !== 'all') data = data.filter(r => r.ticket === currentFilter);
  if (currentSearch) {
    const q = currentSearch.toLowerCase();
    data = data.filter(r =>
      `${r.firstname} ${r.lastname}`.toLowerCase().includes(q) ||
      (r.email||'').toLowerCase().includes(q) ||
      (r.org||'').toLowerCase().includes(q) ||
      (r.id||'').toLowerCase().includes(q)
    );
  }
  data.sort((a, b) => new Date(b.timestamp||0) - new Date(a.timestamp||0));

  tbody.innerHTML = '';
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--txt4);">No registrations match your search</td></tr>`;
    return;
  }

  data.forEach(reg => {
    const ticketLabel = TICKET_LABELS[reg.ticket] || reg.ticket;
    const amount      = '₹' + (reg.amount || 0).toLocaleString('en-IN');
    const date        = reg.timestamp ? new Date(reg.timestamp).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="a-cell-primary">${reg.firstname} ${reg.lastname}</div>
        <div class="a-cell-sub">${reg.email}</div>
      </td>
      <td>
        <div class="a-cell-primary">${reg.org}</div>
        <div class="a-cell-sub">${reg.designation || ''}</div>
      </td>
      <td><span class="badge ${reg.ticket==='delegate'?'badge-rose':reg.ticket==='startup'?'badge-amber':'badge-gold'}">${ticketLabel}</span></td>
      <td class="a-cell-primary">${amount}</td>
      <td><span class="badge badge-green">Confirmed</span></td>
      <td>
        <span class="badge ${reg.checkedIn ? 'badge-green' : 'badge-amber'}">${reg.checkedIn ? '✓ In' : 'Pending'}</span>
        ${reg.pitchFiles?.length ? `<div class="a-cell-sub" style="margin-top:4px;">📎 ${reg.pitchFiles.length} file(s)</div>` : ''}
      </td>
      <td>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="abtn" onclick="toggleCheckin('${reg.id}')">${reg.checkedIn ? 'Undo' : 'Check In'}</button>
          <button class="abtn" onclick="viewReceipt('${reg.id}')">Receipt</button>
          <button class="abtn danger" onclick="deleteReg('${reg.id}')">Delete</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });
}

function toggleCheckin(id) {
  const regs = getRegs();
  const idx = regs.findIndex(r => r.id === id);
  if (idx >= 0) { regs[idx].checkedIn = !regs[idx].checkedIn; saveRegs(regs); }
  loadDashboard();
}

function deleteReg(id) {
  if (!confirm('Permanently delete this registration? This cannot be undone.')) return;
  saveRegs(getRegs().filter(r => r.id !== id));
  loadDashboard();
}

function exportCSV() {
  const headers = ['Reg ID','First Name','Last Name','Email','Phone','Organisation','Designation','City','Sector','Ticket','Amount','Payment Method','Award Categories','Checked In','Timestamp'];
  const rows = getRegs().map(r => [
    r.id, r.firstname, r.lastname, r.email, r.phone, r.org, r.designation, r.city, r.sector,
    TICKET_LABELS[r.ticket]||r.ticket, r.amount||0, r.payMethod||'',
    `"${(r.awards||[]).join('; ')}"`,
    r.checkedIn ? 'Yes' : 'No',
    r.timestamp || '',
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `WPSA2026-Registrations-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

/* ── RECEIPT VIEWER ── */
function makeQR(data) {
  const hash = n => [...data].reduce((h,c) => ((h<<5)-h+c.charCodeAt(0))|0, n);
  const size = 21; const cells = [];
  for (let r=0;r<size;r++) for (let c=0;c<size;c++) {
    const inFP = (r<7&&c<7)||(r<7&&c>=size-7)||(r>=size-7&&c<7);
    let bit = inFP ? (r===0||r===6||c===0||c===6||(r>=2&&r<=4&&c>=2&&c<=4))
      : r===6||c===6 ? (r+c)%2===0
      : (Math.abs(hash(r*size+c)*2654435761)|0)%3===0;
    if (bit) cells.push(`<rect x="${c*4}" y="${r*4}" width="4" height="4"/>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 84" style="background:#fff;padding:6px;border-radius:3px;width:100px;height:100px;display:block;margin:0 auto;"><g fill="#c9952a">${cells.join('')}</g></svg>`;
}

function viewReceipt(id) {
  const reg = getRegs().find(r => r.id === id);
  if (!reg) return;
  const t = TICKET_LABELS[reg.ticket] || reg.ticket;
  const w = window.open('','_blank','width=640,height=860');
  w.document.write(`<!DOCTYPE html><html><head><title>Receipt — ${reg.id}</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,sans-serif;background:#0e0115;color:#e8d8c8;padding:28px}
  .box{max-width:480px;margin:0 auto;border:1px solid #c9952a;border-radius:8px;overflow:hidden}
  .hd{background:linear-gradient(135deg,#2a0940,#380c55);padding:26px;text-align:center;border-bottom:1px solid #c9952a}
  .hd img{height:40px;margin:0 auto 12px;display:block}
  .hd h2{font-family:"Playfair Display",serif;font-size:1.25rem;color:#fdf8f2;margin-bottom:4px}
  .hd p{font-size:.8rem;color:#c9952a;letter-spacing:.06em}
  .bd{padding:22px;background:#1f062f}
  .qr{text-align:center;margin-bottom:18px}
  .qr p{font-size:.75rem;color:#906878;margin-top:8px}
  .row{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid rgba(201,149,42,.18);font-size:.875rem}
  .row:last-child{border-bottom:none}
  .rl{color:#906878;white-space:nowrap}.rv{color:#fdf8f2;font-weight:600;text-align:right;word-break:break-word;max-width:300px}
  .ft{background:#2a0940;padding:14px;text-align:center;font-size:.8rem;color:#604858;line-height:1.8}
  .ft a{color:#c9952a}
  .status{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:20px;font-size:.75rem;font-weight:600;background:rgba(76,171,130,.15);border:1px solid rgba(76,171,130,.4);color:#4cab82;margin-top:6px}
  @media print{body{background:#fff;color:#000;padding:0}.bd{background:#fff}.hd{background:#2a0940!important;-webkit-print-color-adjust:exact}}</style></head><body>
  <div class="box">
    <div class="hd">
      <img src="assets/img/logo.png" alt="Billennium Divas" onerror="this.src='https://www.womenpowersummit.in/assets/img/logo/Logo%20Full%20Color.png';this.onerror=null;">
      <h2>WPSA 2026 — Entry Receipt</h2>
      <p>11th Annual Women Power Summit & Awards</p>
    </div>
    <div class="bd">
      <div class="qr">${makeQR(reg.id+'|'+reg.email)}
        <p>Scan to verify at check-in · <strong style="color:#c9952a">${reg.id}</strong></p>
        <div class="status">${reg.checkedIn ? '✓ Checked In' : '⏳ Not yet checked in'}</div>
      </div>
      <div class="row"><span class="rl">Name</span><span class="rv">${reg.firstname} ${reg.lastname}</span></div>
      <div class="row"><span class="rl">Email</span><span class="rv">${reg.email}</span></div>
      <div class="row"><span class="rl">Organisation</span><span class="rv">${reg.org}</span></div>
      <div class="row"><span class="rl">Pass</span><span class="rv">${t}</span></div>
      ${reg.awards?.length ? `<div class="row"><span class="rl">Categories</span><span class="rv">${reg.awards.join(' · ')}</span></div>` : ''}
      <div class="row"><span class="rl">Amount Paid</span><span class="rv">₹${(reg.amount||0).toLocaleString('en-IN')}</span></div>
      <div class="row"><span class="rl">Payment</span><span class="rv">${(reg.payMethod||'').toUpperCase()}</span></div>
      <div class="row"><span class="rl">Registered</span><span class="rv">${new Date(reg.timestamp).toLocaleString('en-IN')}</span></div>
    </div>
    <div class="ft"><p>23rd May 2026 · NSE, Bandra Kurla Complex, Mumbai</p><p>Queries: <a href="mailto:connect@billenniumdivas.fund">connect@billenniumdivas.fund</a></p></div>
  </div>
  <div style="text-align:center;margin-top:20px;display:flex;gap:12px;justify-content:center;">
    <button onclick="window.print()" style="padding:12px 28px;background:#c9952a;border:none;border-radius:3px;color:#0e0115;font-size:.8rem;font-weight:700;cursor:pointer;letter-spacing:.1em;text-transform:uppercase;">🖨 Print</button>
  </div></body></html>`);
  w.document.close();
}

/* ── CHECK-IN SEARCH ── */
function resetCheckinSearch() {
  const inp = document.getElementById('ci-input');
  const res = document.getElementById('ci-result');
  if (inp) inp.value = '';
  if (res) res.innerHTML = '';
}

function doCheckinSearch() {
  const q   = (document.getElementById('ci-input').value || '').trim().toLowerCase();
  const res = document.getElementById('ci-result');
  if (!q) { res.innerHTML = '<p style="color:var(--txt3)">Enter a registration ID or email address.</p>'; return; }

  const reg = getRegs().find(r =>
    (r.id||'').toLowerCase() === q ||
    (r.email||'').toLowerCase() === q
  );

  if (!reg) {
    res.innerHTML = `<div class="ci-card ci-not-found"><div class="ci-icon">❌</div><div><strong>Not Found</strong><p>No registration matches "${q}".</p></div></div>`;
    return;
  }

  res.innerHTML = `
    <div class="ci-card ${reg.checkedIn ? 'ci-done' : 'ci-pending'}">
      <div>
        <div class="ci-name">${reg.firstname} ${reg.lastname}</div>
        <div class="ci-meta">${reg.org} · ${TICKET_LABELS[reg.ticket]||reg.ticket}</div>
        <div class="ci-meta">${reg.email} · ₹${(reg.amount||0).toLocaleString('en-IN')}</div>
        ${reg.awards?.length ? `<div class="ci-meta" style="color:var(--gold);margin-top:4px;">Categories: ${reg.awards.join(', ')}</div>` : ''}
        <div style="margin-top:10px;">
          <span class="badge ${reg.checkedIn?'badge-green':'badge-amber'}">${reg.checkedIn ? '✓ Already Checked In' : '⏳ Not Yet Checked In'}</span>
        </div>
      </div>
      ${!reg.checkedIn
        ? `<button class="btn btn-gold btn-sm" onclick="checkInNow('${reg.id}')">✓ Check In Now</button>`
        : `<p style="color:var(--green);font-weight:600;font-size:.875rem;">✅ Done</p>`
      }
    </div>`;
}

function checkInNow(id) {
  const regs = getRegs();
  const idx = regs.findIndex(r => r.id === id);
  if (idx >= 0) { regs[idx].checkedIn = true; saveRegs(regs); }
  loadDashboard();
  doCheckinSearch();
}

/* ── PITCH SUBMISSIONS ── */
function renderPitchTable() {
  const tbody = document.getElementById('pitch-tbody');
  if (!tbody) return;
  const startups = getRegs().filter(r => r.ticket === 'startup');
  tbody.innerHTML = '';
  if (!startups.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:28px;color:var(--txt4)">No PitchPower registrations yet.</td></tr>`;
    return;
  }
  startups.forEach(reg => {
    const tr = document.createElement('tr');
    const hasFiles = reg.pitchFiles && reg.pitchFiles.length > 0;
    tr.innerHTML = `
      <td><div class="a-cell-primary">${reg.firstname} ${reg.lastname}</div><div class="a-cell-sub">${reg.org}</div></td>
      <td><div class="a-cell-sub">${reg.email}</div></td>
      <td>${hasFiles
          ? reg.pitchFiles.map(f => `<div style="font-size:.875rem;color:var(--gold);padding:2px 0;">📎 ${f}</div>`).join('')
          : `<span style="color:var(--txt4);font-size:.875rem;">No files uploaded yet</span>`}
      </td>
      <td><span class="badge badge-gold" style="font-size:.75rem;">${reg.id}</span></td>
      <td><button class="abtn" onclick="viewReceipt('${reg.id}')">Receipt</button></td>`;
    tbody.appendChild(tr);
  });
}

/* ── LOGIN LOGS ── */
let logSearch = '';
let logFilter = 'all';

function renderLoginLogsTable() {
  const tbody = document.getElementById('log-tbody');
  if (!tbody) return;
  let data = getLoginLogs();

  if (logFilter === 'failed') {
    data = data.filter(l => l.status === 'failed');
  } else if (logFilter !== 'all') {
    data = data.filter(l => l.type === logFilter);
  }
  if (logSearch) {
    const q = logSearch.toLowerCase();
    data = data.filter(l => (l.email || '').toLowerCase().includes(q));
  }

  tbody.innerHTML = '';
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:28px;color:var(--txt4);">No login events match your filter.</td></tr>`;
    return;
  }
  data.forEach(log => {
    const date = new Date(log.timestamp).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="a-cell-sub">${date}</td>
      <td class="a-cell-primary">${log.email}</td>
      <td><span class="badge ${log.type === 'admin' ? 'badge-amber' : 'badge-gold'}">${log.type}</span></td>
      <td><span class="badge ${log.status === 'success' ? 'badge-green' : 'badge-red'}">${log.status}</span></td>`;
    tbody.appendChild(tr);
  });
}

/* ── SETTINGS ── */
function loadSettings() {
  const s = getSettings();
  document.getElementById('set-agenda').checked   = s.sendAgenda;
  document.getElementById('set-receipt').checked  = s.sendReceipt;
  document.getElementById('set-deadline').value   = s.pitchDeadline;
  document.getElementById('set-subject').value    = s.confirmSubject;
  document.getElementById('set-agenda-text').value = s.agendaText;
}

function saveSettingsForm() {
  const s = {
    sendAgenda:    document.getElementById('set-agenda').checked,
    sendReceipt:   document.getElementById('set-receipt').checked,
    pitchDeadline: document.getElementById('set-deadline').value,
    confirmSubject:document.getElementById('set-subject').value,
    agendaText:    document.getElementById('set-agenda-text').value,
  };
  saveSettings(s);
  const btn = document.getElementById('save-settings');
  const orig = btn.textContent;
  btn.textContent = '✓ Saved!';
  btn.style.background = 'var(--green)';
  setTimeout(() => { btn.textContent = orig; btn.style.background = ''; }, 2200);
}

/* ── SEED DEMO DATA ── */
function seedDemo() {
  if (getRegs().length > 0) return;
  const demos = [
    { id:'WPSA26-ALPHA1', firstname:'Priya', lastname:'Sharma', email:'priya@techinnovations.in', phone:'+91 98765 43210', org:'Tech Innovations Ltd', designation:'CEO & Founder', city:'Mumbai, Maharashtra', sector:'Technology (AI / ML / SaaS)', ticket:'award', awards:['Entrepreneur of the Year','Technology (AI / ML / SaaS)','Women Investor Award'], amount:13497, payMethod:'upi', checkedIn:true, status:'confirmed', pitchFiles:[], timestamp:new Date(Date.now()-864e5*4).toISOString() },
    { id:'WPSA26-BETA22', firstname:'Ananya', lastname:'Patel', email:'ananya@greensprouts.io', phone:'+91 91234 56789', org:'GreenSprouts AgriTech', designation:'Co-Founder & CTO', city:'Pune, Maharashtra', sector:'AgriTech', ticket:'startup', awards:[], amount:5000, payMethod:'card', checkedIn:false, status:'confirmed', pitchFiles:['GreenSprouts-PitchDeck-v3.pdf'], timestamp:new Date(Date.now()-864e5*3).toISOString() },
    { id:'WPSA26-GAMMA3', firstname:'Ritika', lastname:'Mehta', email:'ritika@mehtaassoc.com', phone:'+91 87654 32109', org:'Mehta & Associates Legal', designation:'Managing Partner', city:'New Delhi', sector:'Legal & Compliance', ticket:'delegate', awards:[], amount:4999, payMethod:'bank', checkedIn:false, status:'confirmed', pitchFiles:[], timestamp:new Date(Date.now()-864e5*2).toISOString() },
    { id:'WPSA26-DELTA4', firstname:'Sunita', lastname:'Rao', email:'sunita@holistichub.co', phone:'+91 76543 21098', org:'Holistic Wellness Hub', designation:'Founder & Director', city:'Bangalore, Karnataka', sector:'HealthTech & Wellness', ticket:'award', awards:['HealthTech & Wellness','Fitness & Holistic Healing','Social Entrepreneurship'], amount:13497, payMethod:'upi', checkedIn:true, status:'confirmed', pitchFiles:[], timestamp:new Date(Date.now()-864e5).toISOString() },
    { id:'WPSA26-EPS05', firstname:'Meera', lastname:'Krishnan', email:'meera@digicraft.media', phone:'+91 65432 10987', org:'DigiCraft Media', designation:'Creative Director', city:'Chennai, Tamil Nadu', sector:'Media & Entertainment', ticket:'award', awards:['Media & Entertainment','Digital Media & Content'], amount:8998, payMethod:'card', checkedIn:false, status:'confirmed', pitchFiles:[], timestamp:new Date(Date.now()-3600e3*5).toISOString() },
  ];
  saveRegs(demos);
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  seedDemo();

  /* Login form */
  document.getElementById('login-btn')?.addEventListener('click', tryLogin);
  document.getElementById('login-pass')?.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });

  /* Tabs */
  document.querySelectorAll('.atab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));

  /* Search & filter — registrations */
  document.getElementById('reg-search')?.addEventListener('input', e => { currentSearch = e.target.value; renderTable(); });
  document.getElementById('reg-filter')?.addEventListener('change', e => { currentFilter = e.target.value; renderTable(); });

  /* Export */
  document.getElementById('export-btn')?.addEventListener('click', exportCSV);

  /* Check-in */
  document.getElementById('ci-search-btn')?.addEventListener('click', doCheckinSearch);
  document.getElementById('ci-input')?.addEventListener('keydown', e => { if (e.key === 'Enter') doCheckinSearch(); });

  /* Settings */
  document.getElementById('save-settings')?.addEventListener('click', saveSettingsForm);

  /* Login logs */
  document.getElementById('log-search')?.addEventListener('input', e => { logSearch = e.target.value; renderLoginLogsTable(); });
  document.getElementById('log-filter')?.addEventListener('change', e => { logFilter = e.target.value; renderLoginLogsTable(); });
  document.getElementById('clear-logs-btn')?.addEventListener('click', () => {
    if (!confirm('Clear all login logs? This cannot be undone.')) return;
    saveLoginLogs([]);
    renderLoginLogsTable();
  });
});
