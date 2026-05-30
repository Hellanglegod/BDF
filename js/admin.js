/* ═══════════════════════════════════════════════
   WPSA 2026 · admin.js — Organiser Panel
   All data via DB layer (Firebase or localStorage)
   ═══════════════════════════════════════════════ */
"use strict";

const TICKET_LABELS = {
  award: "Award Nomination",
  delegate: "Delegate Pass",
  startup: "PitchPower",
};

/* ════════════════════════════════════════
   LOGIN
   ════════════════════════════════════════ */
async function tryLogin() {
  const email = (document.getElementById("login-email")?.value || "").trim();
  const pass = (document.getElementById("login-pass")?.value || "").trim();
  const err = document.getElementById("login-err");
  if (err) {
    err.style.display = "none";
    err.textContent = "";
  }

  function _showApp() {
    document.getElementById("login-screen").style.display = "none";
    document.getElementById("admin-app").style.display = "block";
    loadDashboard();
  }
  function _showErr(msg) {
    if (err) {
      err.textContent = msg;
      err.style.display = "block";
    }
  }

  // FIX: When Firebase is configured use Firebase Auth;
  // otherwise fall back to the ADMIN_PASS constant (localStorage demo mode).
  if (DB.isFirebase()) {
    try {
      await firebase.auth().signInWithEmailAndPassword(email, pass);

      await DB.addLog({
        email,
        action: "login",
        status: "success",
      });

      _showApp();
    } catch (e) {
      console.error("[Admin] signIn failed:", e.code);
      _showErr(
        e.code === "auth/wrong-password" || e.code === "auth/user-not-found"
          ? "Incorrect email or password."
          : "Login failed: " + (e.message || e.code),
      );
    }
  } else {
    if (email.toLowerCase() === ADMIN_EMAIL && pass === ADMIN_PASS) {
      _showApp();
    } else {
      _showErr("Incorrect email or password.");
    }
  }

  async function loadUserTicket() {
    if (DB.isFirebase()) {
      const user = firebase.auth().currentUser;
      if (!user) return;
      const userDoc = await DB.getUserById(user.uid);
      if (!userDoc) return;
      const ticket = userDoc.ticket; // Assuming ticket info is saved in user profile
      showTicketBasedUI(ticket, userDoc);
    }
  }

  await DB.addLog({
    action: "login",
    status: "success",
    email,
    timestamp: new Date().toISOString(),
  });
}

/* ════════════════════════════════════════
   TABS
   ════════════════════════════════════════ */
let activeTab = "registrations";

function switchTab(tab) {
  activeTab = tab;
  document
    .querySelectorAll(".atab")
    .forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
  document
    .querySelectorAll(".apane")
    .forEach((p) => p.classList.toggle("active", p.id === "pane-" + tab));

  if (tab === "registrations") renderTable();
  if (tab === "pitches") renderPitchTable();
  if (tab === "login-logs") renderLoginLogs();
  if (tab === "users") renderUsersTable();
  if (tab === "settings") loadSettings();
}

/* ════════════════════════════════════════
   DASHBOARD + STATS
   ════════════════════════════════════════ */
let tableFilter = "all";
let tableSearch = "";

async function loadDashboard() {
  const [regs, users, logs] = await Promise.all([
    DB.getRegs(),
    DB.getUsers(),
    DB.getLogs(),
  ]);

  const revenue = regs.reduce((s, r) => s + (r.amount || 0), 0);
  const checkins = regs.filter((r) => r.checkedIn).length;

  _set("st-total", regs.length);
  _set("st-revenue", "₹" + revenue.toLocaleString("en-IN"));
  _set("st-checkin", checkins);
  _set(
    "st-pct",
    regs.length ? Math.round((checkins / regs.length) * 100) + "%" : "0%",
  );
  _set("st-award", regs.filter((r) => r.ticket === "award").length);
  _set("st-delegate", regs.filter((r) => r.ticket === "delegate").length);
  _set("st-startup", regs.filter((r) => r.ticket === "startup").length);
  _set("st-users", users.length);
  _set(
    "st-logins",
    logs.filter((l) => l.action === "login" && l.status === "success").length,
  );

  /* Show backend status */
  const status = DB.status();
  const pill = document.getElementById("backend-pill");
  if (pill) {
    pill.textContent = status.backend;
    pill.className = "badge " + (status.ready ? "badge-green" : "badge-amber");
    pill.title = status.ready
      ? "Data is shared across all devices via Firebase"
      : "Data is local to this browser only — configure Firebase to share data";
  }

  renderTable(regs);
}

function showTicketBasedUI(ticket, user) {
  // Hide all conditional sections first
  document.getElementById("pitch-panel").style.display = "none";
  document.getElementById("reg-ticket-display").style.display = "none";

  // Show based on ticket type
  if (ticket === "delegate") {
    document.getElementById("reg-ticket-display").innerText =
      "Your Ticket: Delegate Pass";
    document.getElementById("reg-ticket-display").style.display = "block";
  } else if (ticket === "award") {
    document.getElementById("reg-ticket-display").innerText =
      "Your Ticket: Award Nomination";
    document.getElementById("reg-ticket-display").style.display = "block";
    document.getElementById("pitch-panel").style.display = "block";
  } else if (ticket === "startup") {
    document.getElementById("reg-ticket-display").innerText =
      "Your Ticket: PitchPower";
    document.getElementById("reg-ticket-display").style.display = "block";
    document.getElementById("pitch-panel").style.display = "block";
  }
}

function _set(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

/* ════════════════════════════════════════
   REGISTRATIONS TABLE
   ════════════════════════════════════════ */
async function renderTable(regs) {
  const tbody = document.getElementById("reg-tbody");
  if (!tbody) return;

  if (!regs) regs = await DB.getRegs();
  let data = [...regs];

  if (tableFilter !== "all")
    data = data.filter((r) => r.ticket === tableFilter);
  if (tableSearch) {
    const q = tableSearch.toLowerCase();
    data = data.filter(
      (r) =>
        `${r.firstname} ${r.lastname}`.toLowerCase().includes(q) ||
        (r.email || "").toLowerCase().includes(q) ||
        (r.org || "").toLowerCase().includes(q) ||
        (r.id || "").toLowerCase().includes(q),
    );
  }
  data.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

  tbody.innerHTML = "";
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:36px;color:var(--txt4)">No registrations found.</td></tr>`;
    return;
  }

  data.forEach((reg) => {
    const label = TICKET_LABELS[reg.ticket] || reg.ticket;
    const date = reg.timestamp
      ? new Date(reg.timestamp).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";
    const badgeCls =
      reg.ticket === "delegate"
        ? "badge-rose"
        : reg.ticket === "startup"
          ? "badge-amber"
          : "badge-gold";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <div class="a-cell-primary">${reg.firstname} ${reg.lastname}</div>
        <div class="a-cell-sub">${reg.email}${reg.phone ? " · " + reg.phone : ""}</div>
      </td>
      <td>
        <div class="a-cell-primary">${reg.org}</div>
        <div class="a-cell-sub">${reg.designation || ""}${reg.city ? " · " + reg.city : ""}</div>
      </td>
      <td>
        <span class="badge ${badgeCls}">${label}</span>
        ${
          reg.awards?.length
            ? `<div class="a-cell-sub" style="margin-top:4px">${reg.awards.slice(0, 2).join(", ")}${reg.awards.length > 2 ? ` +${reg.awards.length - 2}` : ""}</div>`
            : ""
        }
      </td>
      <td class="a-cell-primary">
        ₹${(reg.amount || 0).toLocaleString("en-IN")}
        <div class="a-cell-sub">${(reg.payMethod || "").toUpperCase()}</div>
      </td>
      <td>
        <span class="badge badge-green">Confirmed</span>
        <div class="a-cell-sub">${date}</div>
      </td>
      <td>
        <span class="badge ${reg.checkedIn ? "badge-green" : "badge-amber"}">${reg.checkedIn ? "✓ In" : "Pending"}</span>
        ${reg.pitchFiles?.length ? `<div class="a-cell-sub" style="margin-top:4px">📎 ${reg.pitchFiles.length} file(s)</div>` : ""}
      </td>
      <td>
        <div class="action-wrap">
          <button class="abtn" onclick="toggleCheckin('${reg.id}','${!reg.checkedIn}')">${reg.checkedIn ? "Undo" : "Check In"}</button>
          <button class="abtn" onclick="openReceipt('${reg.id}')">Receipt</button>
          <button class="abtn danger" onclick="deleteReg('${reg.id}')">Delete</button>
        </div>
      </td>`;
    tbody.appendChild(tr);
  });

  try {
    const regs = await DB.getRegs();
    console.log("regs ok");

    const users = await DB.getUsers();
    console.log("users ok");

    const logs = await DB.getLogs();
    console.log("logs ok");
  } catch (err) {
    console.error("Dashboard load failed:", err);
  }
}

async function toggleCheckin(id, checkIn) {
  const val = checkIn === "true";
  await DB.updateReg(id, { checkedIn: val });
  loadDashboard();
}

async function deleteReg(id) {
  if (!confirm("Permanently delete this registration? This cannot be undone."))
    return;
  await DB.deleteReg(id);
  loadDashboard();
}

async function exportCSV() {
  const regs = await DB.getRegs();
  const headers = [
    "Reg ID",
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Org",
    "Designation",
    "City",
    "Sector",
    "Ticket",
    "Amount",
    "Payment",
    "Categories",
    "Checked In",
    "Timestamp",
  ];
  const rows = regs.map((r) => [
    r.id,
    r.firstname,
    r.lastname,
    r.email,
    r.phone,
    r.org,
    r.designation,
    r.city,
    r.sector,
    TICKET_LABELS[r.ticket] || r.ticket,
    r.amount || 0,
    r.payMethod || "",
    `"${(r.awards || []).join("; ")}"`,
    r.checkedIn ? "Yes" : "No",
    r.timestamp || "",
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `WPSA2026-Registrations-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

/* ── Receipt popup ── */
function makeQR(data) {
  const hash = (n) =>
    [...data].reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, n);
  const size = 21;
  const cells = [];
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++) {
      const inFP =
        (r < 7 && c < 7) ||
        (r < 7 && c >= size - 7) ||
        (r >= size - 7 && c < 7);
      const bit = inFP
        ? r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        : r === 6 || c === 6
          ? (r + c) % 2 === 0
          : (Math.abs(hash(r * size + c) * 2654435761) | 0) % 3 === 0;
      if (bit)
        cells.push(`<rect x="${c * 4}" y="${r * 4}" width="4" height="4"/>`);
    }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 84" style="background:#fff;padding:6px;border-radius:3px;width:90px;height:90px;display:block;margin:0 auto;"><g fill="#c9952a">${cells.join("")}</g></svg>`;
}

async function openReceipt(id) {
  const reg = await DB.getRegById(id);
  if (!reg) return;
  const t = TICKET_LABELS[reg.ticket] || reg.ticket;
  const w = window.open("", "_blank", "width=620,height=860");
  w.document
    .write(`<!DOCTYPE html><html><head><title>Receipt — ${reg.id}</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,sans-serif;background:#0e0115;color:#e8d8c8;padding:28px}
  .box{max-width:480px;margin:0 auto;border:1px solid #c9952a;border-radius:8px;overflow:hidden}
  .hd{background:linear-gradient(135deg,#2a0940,#380c55);padding:26px;text-align:center;border-bottom:1px solid #c9952a}
  .hd img{height:40px;margin:0 auto 12px;display:block}
  .hd h2{font-family:"Playfair Display",serif;font-size:1.2rem;color:#fdf8f2;margin-bottom:4px}
  .hd p{font-size:.8rem;color:#c9952a}
  .bd{padding:22px;background:#1f062f}
  .qr{text-align:center;margin-bottom:18px}
  .qr p{font-size:.75rem;color:#906878;margin-top:6px}
  .status{display:inline-flex;align-items:center;padding:3px 10px;border-radius:20px;font-size:.75rem;font-weight:600;margin-top:6px;
    background:${reg.checkedIn ? "rgba(76,171,130,.15)" : "rgba(245,160,32,.12)"};
    border:1px solid ${reg.checkedIn ? "rgba(76,171,130,.4)" : "rgba(245,160,32,.35)"};
    color:${reg.checkedIn ? "#4cab82" : "#f5a020"}}
  .row{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:1px solid rgba(201,149,42,.18);font-size:.875rem}
  .row:last-child{border-bottom:none}
  .rl{color:#906878}.rv{color:#fdf8f2;font-weight:600;text-align:right;word-break:break-word;max-width:280px}
  .ft{background:#2a0940;padding:14px;text-align:center;font-size:.8rem;color:#604858;line-height:1.8}
  .ft a{color:#c9952a}
  .btn{display:block;margin:22px auto 0;padding:13px 36px;background:#c9952a;border:none;border-radius:3px;color:#0e0115;font-size:.8rem;font-weight:700;cursor:pointer;letter-spacing:.1em;text-transform:uppercase}
  @media print{.btn{display:none}body{background:#fff}}</style></head><body>
  <div class="box">
    <div class="hd">
      <img src="assets/img/logo.png" onerror="this.src='https://www.womenpowersummit.in/assets/img/logo/Logo%20Full%20Color.png';this.onerror=null;" alt="Billennium Divas">
      <h2>WPSA 2026 — Entry Receipt</h2><p>11th Annual Women Power Summit &amp; Awards</p>
    </div>
    <div class="bd">
      <div class="qr">${makeQR(reg.id + "|" + reg.email)}
        <p>Scan to verify · <strong style="color:#c9952a">${reg.id}</strong></p>
        <div class="status">${reg.checkedIn ? "✓ Checked In" : "⏳ Not yet checked in"}</div>
      </div>
      <div class="row"><span class="rl">Name</span><span class="rv">${reg.firstname} ${reg.lastname}</span></div>
      <div class="row"><span class="rl">Email</span><span class="rv">${reg.email}</span></div>
      <div class="row"><span class="rl">Organisation</span><span class="rv">${reg.org}</span></div>
      <div class="row"><span class="rl">Pass</span><span class="rv">${t}</span></div>
      ${reg.awards?.length ? `<div class="row"><span class="rl">Categories</span><span class="rv">${reg.awards.join(" · ")}</span></div>` : ""}
      <div class="row"><span class="rl">Amount Paid</span><span class="rv">₹${(reg.amount || 0).toLocaleString("en-IN")}</span></div>
      <div class="row"><span class="rl">Payment</span><span class="rv">${(reg.payMethod || "").toUpperCase()}</span></div>
      <div class="row"><span class="rl">Registered</span><span class="rv">${new Date(reg.timestamp).toLocaleString("en-IN")}</span></div>
    </div>
    <div class="ft"><p>23rd May 2026 · NSE, BKC, Mumbai · 09:30 AM – 06:00 PM</p>
    <p>Queries: <a href="mailto:connect@billenniumdivas.fund">connect@billenniumdivas.fund</a></p></div>
  </div>
  <button class="btn" onclick="window.print()">🖨 Print Receipt</button></body></html>`);
  w.document.close();
}

/* ════════════════════════════════════════
   CHECK-IN
   ════════════════════════════════════════ */
async function doCheckinSearch() {
  const q = (document.getElementById("ci-input").value || "")
    .trim()
    .toLowerCase();
  const res = document.getElementById("ci-result");
  if (!q) {
    res.innerHTML =
      '<p style="color:var(--txt3)">Enter a registration ID or email address.</p>';
    return;
  }

  const regs = await DB.getRegs();
  const reg = regs.find(
    (r) =>
      (r.id || "").toLowerCase() === q || (r.email || "").toLowerCase() === q,
  );

  if (!reg) {
    res.innerHTML = `<div class="ci-card ci-not-found"><div class="ci-icon">❌</div><div><strong>Not Found</strong><p style="color:var(--txt3);margin-top:4px;">No registration matches "${q}".</p></div></div>`;
    return;
  }

  const t = TICKET_LABELS[reg.ticket] || reg.ticket;
  res.innerHTML = `
    <div class="ci-card ${reg.checkedIn ? "ci-done" : "ci-pending"}">
      <div>
        <div class="ci-name">${reg.firstname} ${reg.lastname}</div>
        <div class="ci-meta">${reg.org} · ${t}</div>
        <div class="ci-meta">${reg.email}</div>
        <div class="ci-meta">₹${(reg.amount || 0).toLocaleString("en-IN")} · ${(reg.payMethod || "").toUpperCase()}</div>
        ${reg.awards?.length ? `<div class="ci-meta" style="color:var(--gold);margin-top:4px;">Categories: ${reg.awards.join(", ")}</div>` : ""}
        <div style="margin-top:10px"><span class="badge ${reg.checkedIn ? "badge-green" : "badge-amber"}">${reg.checkedIn ? "✓ Already Checked In" : "⏳ Not yet checked in"}</span></div>
      </div>
      ${
        !reg.checkedIn
          ? `<button class="btn btn-gold btn-sm" onclick="checkInNow('${reg.id}')">✓ Mark Checked In</button>`
          : `<button class="btn btn-ghost btn-sm" onclick="undoCheckin('${reg.id}')">Undo</button>`
      }
    </div>`;
}

async function checkInNow(id) {
  await DB.updateReg(id, { checkedIn: true });
  loadDashboard();
  doCheckinSearch();
}
async function undoCheckin(id) {
  await DB.updateReg(id, { checkedIn: false });
  loadDashboard();
  doCheckinSearch();
}

/* ════════════════════════════════════════
   PITCH SUBMISSIONS
   ════════════════════════════════════════ */
async function renderPitchTable() {
  const tbody = document.getElementById("pitch-tbody");
  if (!tbody) return;

  const all = await DB.getRegs();
  const startups = all.filter((r) => r.ticket === "startup");

  tbody.innerHTML = "";
  if (!startups.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:28px;color:var(--txt4)">No PitchPower registrations yet.</td></tr>`;
    return;
  }
  startups.forEach((reg) => {
    const hasFiles = reg.pitchFiles?.length > 0;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><div class="a-cell-primary">${reg.firstname} ${reg.lastname}</div><div class="a-cell-sub">${reg.org}</div></td>
      <td><div class="a-cell-sub">${reg.email}</div></td>
      <td>${
        hasFiles
          ? reg.pitchFiles
              .map(
                (f) =>
                  `<div style="font-size:.875rem;color:var(--gold);padding:2px 0;">📎 ${f}</div>`,
              )
              .join("")
          : `<span style="color:var(--txt4);font-size:.875rem;">No files uploaded yet</span>`
      }</td>
      <td><span class="badge badge-gold" style="font-size:.7rem;">${reg.id}</span></td>
      <td><button class="abtn" onclick="openReceipt('${reg.id}')">Receipt</button></td>`;
    tbody.appendChild(tr);
  });
}

/* ════════════════════════════════════════
   LOGIN LOGS
   ════════════════════════════════════════ */
let logFilter = "all";
let logSearch = "";

async function renderLoginLogs() {
  const container = document.getElementById("log-tbody");
  if (!container) return;

  let logs = await DB.getLogs();

  /* Update log stats */
  _set("log-total", logs.length);
  _set(
    "log-logins-ok",
    logs.filter((l) => l.action === "login" && l.status === "success").length,
  );
  _set(
    "log-logins-fail",
    logs.filter((l) => l.action === "login" && l.status === "failed").length,
  );
  _set("log-registers", logs.filter((l) => l.action === "register").length);
  _set(
    "log-reg-complete",
    logs.filter((l) => l.action === "registration_complete").length,
  );
  _set(
    "log-downloads",
    logs.filter((l) => l.action === "download_ticket").length,
  );
  _set("log-pitches", logs.filter((l) => l.action === "pitch_upload").length);

  /* Apply filters */
  if (logFilter !== "all")
    logs = logs.filter((l) => l.action === logFilter || l.status === logFilter);
  if (logSearch) {
    const q = logSearch.toLowerCase();
    logs = logs.filter(
      (l) =>
        (l.email || "").toLowerCase().includes(q) ||
        (l.note || "").toLowerCase().includes(q),
    );
  }

  if (!logs.length) {
    container.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:36px;color:var(--txt4);">No activity logged yet. Events appear as soon as users interact with the site.</td></tr>`;
    return;
  }

  const ACTION_ICON = {
    login: "🔑",
    logout: "↩",
    register: "✨",
    registration_complete: "🎫",
    download_ticket: "⬇",
    pitch_upload: "📤",
    print_ticket: "🖨",
    password_reset_request: "🔒",
  };

  container.innerHTML = logs
    .map((l) => {
      const cls =
        l.status === "success"
          ? "badge-green"
          : l.status === "failed"
            ? "badge-red"
            : "badge-amber";

      const icon = ACTION_ICON[l.action] || "•";

      const dt = new Date(l.timestamp);

      return `
    <tr>
      <td>
        ${dt.toLocaleString("en-IN")}
      </td>

      <td>
        ${l.email || "—"}
      </td>

      <td>
        ${icon} ${(l.action || "").replace(/_/g, " ")}
      </td>

      <td>
        <span class="badge ${cls}">
          ${l.status}
        </span>
      </td>
    </tr>
  `;
    })
    .join("");
}

async function exportLogs() {
  const logs = await DB.getLogs();
  const headers = [
    "Timestamp",
    "Email",
    "Action",
    "Status",
    "Note",
    "User Agent",
  ];
  const rows = logs.map((l) => [
    l.timestamp,
    l.email,
    l.action,
    l.status,
    `"${l.note || ""}"`,
    `"${(l.userAgent || "").replace(/"/g, "'")}"`,
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `WPSA2026-LoginLogs-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

async function clearLogs() {
  if (!confirm("Clear ALL login logs? This cannot be undone.")) return;
  await DB.clearLogs();
  renderLoginLogs();
}

/* ════════════════════════════════════════
   USERS TABLE
   ════════════════════════════════════════ */
async function renderUsersTable() {
  const tbody = document.getElementById("users-tbody");
  if (!tbody) return;

  const [users, regs] = await Promise.all([DB.getUsers(), DB.getRegs()]);

  tbody.innerHTML = "";
  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:28px;color:var(--txt4)">No registered user accounts yet.</td></tr>`;
    return;
  }
  users.forEach((u) => {
    const userRegs = regs.filter(
      (r) =>
        r.userId === u.uid ||
        (r.email || "").toLowerCase() === (u.email || "").toLowerCase(),
    );
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><div class="a-cell-primary">${u.displayName || u.firstname + " " + (u.lastname || "")}</div><div class="a-cell-sub">${u.uid}</div></td>
      <td><div class="a-cell-sub">${u.email}</div><div class="a-cell-sub">${u.phone || "—"}</div></td>
      <td><span class="badge badge-gold">${userRegs.length} reg${userRegs.length !== 1 ? "s" : ""}</span></td>
      <td class="a-cell-sub">${new Date(u.createdAt || 0).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
      <td><button class="abtn danger" onclick="deleteUser('${u.uid}')">Delete</button></td>`;
    tbody.appendChild(tr);
  });
}

async function deleteUser(uid) {
  if (!confirm("Delete this user account? Their registrations will remain."))
    return;
  await DB.deleteUser(uid);
  renderUsersTable();
  loadDashboard();
}

/* ════════════════════════════════════════
   SETTINGS
   ════════════════════════════════════════ */
async function loadSettings() {
  const s = await DB.getSettings();
  document.getElementById("set-receipt").checked = s.sendReceipt ?? true;
  document.getElementById("set-agenda").checked = s.sendAgenda ?? true;
  document.getElementById("set-deadline").value =
    s.pitchDeadline || "2026-05-15";
  document.getElementById("set-subject").value = s.confirmSubject || "";
  document.getElementById("set-agenda-text").value = s.agendaText || "";
}

async function saveSettingsForm() {
  const s = {
    sendReceipt: document.getElementById("set-receipt").checked,
    sendAgenda: document.getElementById("set-agenda").checked,
    pitchDeadline: document.getElementById("set-deadline").value,
    confirmSubject: document.getElementById("set-subject").value,
    agendaText: document.getElementById("set-agenda-text").value,
  };
  await DB.saveSettings(s);
  const btn = document.getElementById("save-settings");
  const orig = btn.textContent;
  btn.textContent = "✓ Saved!";
  btn.style.background = "var(--green)";
  setTimeout(() => {
    btn.textContent = orig;
    btn.style.background = "";
  }, 2200);
}

/* FIX-10/11/12: Removed broken top-level onAuthStateChanged. */

/* ════════════════════════════════════════
   INIT
   ════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  if (DB.isFirebase()) {
    firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) {
        document.getElementById("login-screen").style.display = "block";
        document.getElementById("admin-app").style.display = "none";
        return;
      }

      try {
        const tokenResult = await user.getIdTokenResult(true);

        const isAdmin = tokenResult.claims.admin === true;

        if (!isAdmin) {
          await firebase.auth().signOut();

          document.getElementById("login-screen").style.display = "block";
          document.getElementById("admin-app").style.display = "none";

          return;
        }

        document.getElementById("login-screen").style.display = "none";
        document.getElementById("admin-app").style.display = "block";

        loadDashboard();
      } catch (err) {
        console.error(err);

        document.getElementById("login-screen").style.display = "block";
        document.getElementById("admin-app").style.display = "none";
      }
    });
  }

  document.getElementById("logout-btn")?.addEventListener("click", async () => {
    const user = firebase.auth().currentUser;

    await DB.addLog({
      email: user?.email || "",
      action: "logout",
      status: "success",
    });

    if (DB.isFirebase()) {
      await firebase
        .auth()
        .signOut()
        .catch(() => {});
    }

    location.reload();
    window.location.href = "index.html";
  });

  /* Login */
  document.getElementById("login-btn")?.addEventListener("click", tryLogin);

  document.getElementById("login-pass")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") tryLogin();
  });

  /* Tabs */
  document
    .querySelectorAll(".atab")
    .forEach((t) =>
      t.addEventListener("click", () => switchTab(t.dataset.tab)),
    );

  /* Registrations controls */
  document.getElementById("reg-search")?.addEventListener("input", (e) => {
    tableSearch = e.target.value;
    renderTable();
  });

  document.getElementById("reg-filter")?.addEventListener("change", (e) => {
    tableFilter = e.target.value;
    renderTable();
  });

  document.getElementById("export-btn")?.addEventListener("click", exportCSV);
  document
    .getElementById("export-btn-inline")
    ?.addEventListener("click", exportCSV);

  /* Check-in */
  document
    .getElementById("ci-search-btn")
    ?.addEventListener("click", doCheckinSearch);

  document.getElementById("ci-input")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doCheckinSearch();
  });

  /* Login logs */
  document.getElementById("log-filter")?.addEventListener("change", (e) => {
    logFilter = e.target.value;
    renderLoginLogs();
  });

  document.getElementById("log-search")?.addEventListener("input", (e) => {
    logSearch = e.target.value;
    renderLoginLogs();
  });

  document
    .getElementById("export-logs-btn")
    ?.addEventListener("click", exportLogs);

  document
    .getElementById("clear-logs-btn")
    ?.addEventListener("click", clearLogs);

  /* Settings */
  document
    .getElementById("save-settings")
    ?.addEventListener("click", saveSettingsForm);
});

/*if (isAdmin()) {
  loadLogs();
}*/
