/* ═══════════════════════════════════════════════
   WPSA 2026 · main.js
   Registration · Payment · Receipt · Pitch Upload
   ═══════════════════════════════════════════════ */
'use strict';
/* =========================
   FORCE FIREBASE INIT
========================= */

if (typeof DB !== 'undefined') {
  DB.isFirebase();
}

/* =========================
   ADMIN ACCESS
========================= */

const ADMIN_EMAILS = [
  'admin@womenpowersummit.in',
  'organiser@womenpowersummit.in',
  'kothari.jihan@gmail.com'
];

function isAdminUser(user) {
  return !!user &&
    ADMIN_EMAILS.includes(
      (user.email || '').toLowerCase()
    );
}

/* ═════════════════════════════════
   DATA
   ═════════════════════════════════ */

const TICKET_TYPES = {
  award:    { label: 'Award Nomination', price: 4499, priceNote: 'per category · up to 5 categories' },
  delegate: { label: 'Delegate Pass',    price: 4999, priceNote: 'per person · full-day access'       },
  startup:  { label: 'PitchPower',       price: 5000, priceNote: 'per startup · includes delegate access' },
};

/* Award categories — 30 women + 10 ecosystem = 40 total
   Organised into readable sector groups */
const AWARD_SECTORS = [
  {
    id: 'excellence',
    label: 'Excellence in Entrepreneurship',
    type: 'women',
    icon: '🏆',
    cats: [
      'Entrepreneur of the Year',
      'Young Entrepreneur of the Year (Under 35)',
      'Senior Entrepreneur – Beyond 60+',
    ],
  },
  {
    id: 'sector-tech',
    label: 'Technology & Digital',
    type: 'women',
    icon: '💻',
    cats: [
      'Technology (AI / ML / SaaS)',
      'HealthTech & Wellness',
      'FinTech',
      'EduTech',
      'AgriTech',
      'Digital Media & Content',
    ],
  },
  {
    id: 'sector-biz',
    label: 'Business & Industry',
    type: 'women',
    icon: '🏭',
    cats: [
      'D2C / Retail',
      'Manufacturing',
      'Food & Beverage',
      'Fashion & Lifestyle',
      'Transportation & Logistics',
      'MICE (Events & Hospitality)',
      'Recruitment & HR',
    ],
  },
  {
    id: 'sector-creative',
    label: 'Creative & Lifestyle',
    type: 'women',
    icon: '🎨',
    cats: [
      'Media & Entertainment',
      'Arts & Craft',
      'Fitness & Holistic Healing',
      'Public Relations',
    ],
  },
  {
    id: 'sector-impact',
    label: 'Impact & Leadership',
    type: 'women',
    icon: '🌟',
    cats: [
      'Social Entrepreneurship',
      'Community Builder',
      'Sustainability Champion',
      'DE&I Champion',
      'Homepreneur of the Year',
      'Legal & Compliance Excellence',
      'Education Leadership',
    ],
  },
  {
    id: 'recognition',
    label: 'Special Recognition',
    type: 'women',
    icon: '🎖️',
    cats: [
      'Women Investor Award',
      'Women Mentor Award',
      'Women Influencer Award',
    ],
  },
  {
    id: 'ecosystem',
    label: 'Startup Ecosystem Enablers',
    type: 'eco',
    icon: '🚀',
    cats: [
      'Incubator of the Year',
      'Accelerator of the Year',
      'Angel Investor / VC of the Year',
      'E-Cell of the Year',
      'Co-Working Space of the Year',
      'Startup Tech Enabler of the Year',
      'CSR Organization of the Year',
      'Government Initiative of the Year',
      'Startup Story Platform of the Year',
      "Jury's Special Choice Award",
    ],
  },
];

/* Flat list for home page tags */
const ALL_CATS_FLAT = AWARD_SECTORS.flatMap(s => s.cats.map(c => ({ name: c, type: s.type })));

const JURY = [
  { i:'SS', name:'Ms. Shweta Shalini',      role:'Chief Evangelist, Billennium Divas · TEDx Speaker', chair:true,  img:'https://www.womenpowersummit.in/assets/img/new_images/SS.jpg' },
  { i:'AT', name:'Mr. Ajay Thakur',          role:'CEO & Managing Partner, TGI SME Capital Advisors LLP',           img:'https://www.womenpowersummit.in/assets/img/new_images/AT.jpeg' },
  { i:'MS', name:'Mr. Mahavir Pratap Sharma',role:'General Partner, Swishin Ventures',                             img:'https://www.womenpowersummit.in/assets/img/new_images/MS.jpg' },
  { i:'RR', name:'Mr. Ramanan Ramanathan',   role:'Mission Director, Atal Innovation Mission',                     img:'https://www.womenpowersummit.in/assets/img/new_images/RR.png' },
  { i:'TC', name:'Ms. Tanya Chaitanya',      role:'CEO, Her Circle · President Digital & Diversity, Reliance',     img:'https://www.womenpowersummit.in/assets/img/new_images/TC.jpg' },
  { i:'AS', name:'Mr. Amit Singal',          role:'Founding Partner, Fluid Ventures',                              img:'https://www.womenpowersummit.in/assets/img/new_images/AS.jpg' },
  { i:'SG', name:'Ms. Sonia Sharma Gupta',   role:'Co-Founder & Head IR, IvyCap Ventures',                        img:'https://www.womenpowersummit.in/assets/img/new_images/SSG.jpeg' },
  { i:'CO', name:'Mr. Chintan Oza',          role:'Founder, Anantam Ecosystems',                                   img:'https://www.womenpowersummit.in/assets/img/new_images/CO.png' },
  { i:'RB', name:'Ms. Rachana Bhusari',      role:'CCO & Head Legal, ICICIDirect',                                 img:'https://www.womenpowersummit.in/assets/img/new_images/RB.jpg' },
  { i:'AB', name:'Mr. Adhiraj Banerjee',     role:'Founder, OpenDelta',                                            img:'https://www.womenpowersummit.in/assets/img/new_images/AB.jpg' },
  { i:'JT', name:'Ms. Jyoti M Tiwari',       role:'Founder & CEO, Ingenious Works',                               img:'https://www.womenpowersummit.in/assets/img/new_images/JT.jpeg' },
  { i:'DM', name:'Ms. Divya Momaya',         role:'Founder, MentorMyBoard',                                        img:'https://www.womenpowersummit.in/assets/img/new_images/DM.jpg' },
];

const GALLERY_SRCS = [
  'https://www.womenpowersummit.in/assets/img/new_images/2.png',
  'https://www.womenpowersummit.in/assets/img/extras/NewGallery_1.webp',
  'https://www.womenpowersummit.in/assets/img/extras/NewGallery_2.webp',
  'https://www.womenpowersummit.in/assets/img/extras/20250530_111055_0000.webp',
  'https://www.womenpowersummit.in/assets/img/extras/20250530_111055_0002.webp',
  'https://www.womenpowersummit.in/assets/img/extras/20250530_111903_0000.webp',
  'https://www.womenpowersummit.in/assets/img/new_images/3.png',
  'https://www.womenpowersummit.in/assets/img/new_images/4.png',
  'https://www.womenpowersummit.in/assets/img/new_images/5.png',
];

const SCHEDULE = [
  { time:'09:30 – 10:30 AM', title:'Registrations & Welcome Tea',         desc:'Check-in, tea & coffee, welcome networking for all delegates' },
  { time:'10:30 – 10:35 AM', title:'Opening Ceremony & Lamp Lighting',    desc:'Chief Guest, Guest of Honour & Dignitaries. Welcome address by organisers.' },
  { time:'10:35 – 10:50 AM', title:'Keynote Address',                     desc:'By the Chief Guest' },
  { time:'10:50 – 11:00 AM', title:'Address by Guest of Honour',          desc:'' },
  { time:'11:00 – 11:30 AM', title:'Fireside Chat',                       desc:'"How can we Unleash the Power of Women Entrepreneurs?"' },
  { time:'11:30 AM – 12:00', title:'Awards Ceremony — Set 1',             desc:'Felicitation of the first batch of Women Power Award Winners 2026' },
  { time:'12:00 – 12:15 PM', title:'Empower Track 1',                     desc:'Bridging the Digital Divide & Increasing Access for Women Entrepreneurs' },
  { time:'12:15 – 01:00 PM', title:'Panel Discussion 1',                  desc:'"Future Forward: Women Leading Innovation and Technology in Business"' },
  { time:'01:00 – 02:00 PM', title:'Power Lunch & Networking',            desc:'Exclusive networking with 250+ women entrepreneurs, investors & thought-leaders' },
  { time:'02:00 – 02:30 PM', title:'Awards Ceremony — Set 2',             desc:'Felicitation of the second batch of Women Power Award Winners 2026' },
  { time:'02:30 – 02:45 PM', title:'Empower Track 2',                     desc:'Leveraging Technology for Business Growth & Scale' },
  { time:'02:45 – 03:30 PM', title:'Panel Discussion 2',                  desc:'"Beyond the Numbers: Unpacking Gender Bias in Funding Decisions"' },
  { time:'03:30 – 05:00 PM', title:'PitchPower — Startup Pitches',        desc:'Top 10 curated startups pitch to the Investor Panel · 10-min elevator pitches' },
  { time:'05:00 – 05:30 PM', title:'Awards Ceremony — Set 3',             desc:'Felicitation of the final batch of Women Power Award Winners 2026' },
  { time:'05:30 – 06:00 PM', title:'Vote of Thanks & Power Networking',   desc:'Celebrate, connect and forge partnerships that last beyond the summit' },
];

const PARTNERS = [
  { tier:'Organised By', items:[
    { i:'BD', name:'Billennium Divas Private Limited', type:'Event Organiser · Founded 2017' },
  ]},
  { tier:'Supported By', items:[
    { i:'EC', name:"Eves Entrepreneurship Excellence Academy (E³)", type:'Supporting Partner' },
    { i:'CW', name:'Consortium of Empowered Women Entrepreneurs (CEWE)', type:'Supporting Partner' },
    { i:'GI', name:'The Great India Unicorn Hunt', type:'Supporting Partner' },
  ]},
  { tier:'Knowledge Partners', items:[
    { i:'CI', name:"Chetana's Institute of Management & Research", type:'Knowledge Partner' },
    { i:'AI', name:'Atal Innovation Mission', type:'Knowledge Partner' },
  ]},
  { tier:'Investor & Venture Partners', items:[
    { i:'VW', name:'Venture Wolf', type:'Investment Partner' },
    { i:'FV', name:'Fluid Ventures', type:'Venture Partner' },
    { i:'IC', name:'IvyCap Ventures', type:'Investor Partner' },
    { i:'SW', name:'Swishin Ventures', type:'Investment Partner' },
    { i:'TG', name:'TGI SME Capital Advisors LLP', type:'Capital Partner' },
  ]},
  { tier:'Community & Ecosystem Partners', items:[
    { i:'HC', name:'Her Circle', type:'Community Partner' },
    { i:'AE', name:'Anantam Ecosystems', type:'Ecosystem Partner' },
    { i:'OD', name:'OpenDelta', type:'Technology Partner' },
    { i:'IW', name:'Ingenious Works', type:'Ecosystem Partner' },
    { i:'MB', name:'MentorMyBoard', type:'Mentorship Partner' },
  ]},
  { tier:'Media Partners', items:[
    { i:'SM', name:'SME World', type:'Media Partner' },
  ]},
];

const SOCIALS = [
  { label:'Instagram',       url:'https://bit.ly/3xc65gO' },
  { label:'LinkedIn',        url:'https://www.linkedin.com/company/billenniumdivas' },
  { label:'Facebook',        url:'https://www.facebook.com/billenniumdivas' },
  { label:'YouTube',         url:'https://bit.ly/3l2FE6B' },
  { label:'Telegram',        url:'https://t.me/billenniumdivas' },
  { label:'WhatsApp',        url:'https://whatsapp.com/channel/0029VaB3C2s6LwHftjmbqu2d' },
  { label:'LinkedIn Group',  url:'https://www.linkedin.com/groups/3724850' },
  { label:'Facebook Group',  url:'https://www.facebook.com/groups/billenniumdivas' },
];

/* ═════════════════════════════════
   STORAGE  ←  now delegates to DB
   (DB uses Firebase when configured,
    localStorage as fallback otherwise)
   ═════════════════════════════════ */

/* These thin wrappers keep the rest of main.js unchanged */
async function _getRegs()           { return DB.getRegs(); }
async function _saveReg(reg)        { return DB.saveReg(reg); }
async function _updateReg(id,patch) { return DB.updateReg(id, patch); }
async function _addLog(entry)       { return DB.addLog(entry); }

/* ═════════════════════════════════
   TAB NAVIGATION
   ═════════════════════════════════ */

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.getElementById('page-' + id)?.classList.add('active');
  document.querySelector(`.nav-link[data-page="${id}"]`)?.classList.add('active');
  document.getElementById('nav-mobile-menu')?.classList.remove('open');
  document.getElementById('nav-hamburger')?.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ═════════════════════════════════
   COUNTDOWN
   ═════════════════════════════════ */

function startCountdown() {
  const target = new Date('2026-05-23T09:30:00+05:30').getTime();
  const pad = n => String(n).padStart(2, '0');
  function tick() {
    let diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / 86400000); diff -= d * 86400000;
    const h = Math.floor(diff / 3600000);  diff -= h * 3600000;
    const m = Math.floor(diff / 60000);    diff -= m * 60000;
    const s = Math.floor(diff / 1000);
    const el = id => document.getElementById(id);
    if (el('cd-d')) el('cd-d').textContent = pad(d);
    if (el('cd-h')) el('cd-h').textContent = pad(h);
    if (el('cd-m')) el('cd-m').textContent = pad(m);
    if (el('cd-s')) el('cd-s').textContent = pad(s);
  }
  tick();
  setInterval(tick, 1000);
}

/* ═════════════════════════════════
   HOME PAGE RENDERS
   ═════════════════════════════════ */

function renderHomeAwards(filter = 'all') {
  const c = document.getElementById('award-cloud');
  if (!c) return;
  c.innerHTML = '';
  ALL_CATS_FLAT
    .filter(x => filter === 'all' || x.type === filter)
    .forEach(x => {
      const span = document.createElement('span');
      span.className = 'award-cloud-tag' + (x.type === 'eco' ? ' eco' : '');
      span.textContent = x.name;
      c.appendChild(span);
    });
}

function renderSchedule() {
  const el = document.getElementById('schedule-list');
  if (!el) return;
  SCHEDULE.forEach(row => {
    const div = document.createElement('div');
    div.className = 'sch-row';
    div.innerHTML = `<div class="sch-time">${row.time}</div><div><div class="sch-title">${row.title}</div>${row.desc ? `<div class="sch-desc">${row.desc}</div>` : ''}</div>`;
    el.appendChild(div);
  });
}

function renderJury() {
  const g = document.getElementById('jury-grid');
  if (!g) return;
  JURY.forEach(j => {
    const fb = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 76 76'%3E%3Crect fill='%232a0940' width='76' height='76' rx='38'/%3E%3Ctext y='50' x='50%25' text-anchor='middle' fill='%23c9952a' font-size='22' font-family='Georgia,serif'%3E${j.i}%3C/text%3E%3C/svg%3E`;
    const card = document.createElement('div');
    card.className = 'jury-card';
    card.innerHTML = `<img class="jury-avatar" src="${j.img}" alt="${j.name}" loading="lazy" onerror="this.src='${fb}'">
      <div class="jury-name">${j.name}</div>
      <div class="jury-role">${j.role}</div>
      ${j.chair ? `<div class="badge badge-gold" style="margin-top:8px;">Jury Chair</div>` : ''}`;
    g.appendChild(card);
  });
}

function renderGallery() {
  const g = document.getElementById('gallery-grid');
  if (!g) return;
  GALLERY_SRCS.forEach((src, i) => {
    const img = document.createElement('img');
    img.className = 'gallery-img'; img.src = src; img.alt = `WPSA Gallery ${i+1}`; img.loading = 'lazy';
    img.onerror = function() { this.parentElement?.removeChild(this); };
    g.appendChild(img);
  });
}

function renderPartners() {
  const w = document.getElementById('partner-tiers');
  if (!w) return;
  PARTNERS.forEach(group => {
    const div = document.createElement('div');
    div.className = 'partner-tier';
    div.innerHTML = `<div class="partner-tier-label">${group.tier}</div>
      <div class="partner-chips">${group.items.map(p =>
        `<div class="partner-chip">
          <div class="partner-initials">${p.i}</div>
          <div><div class="partner-name">${p.name}</div><div class="partner-type">${p.type}</div></div>
        </div>`).join('')}</div>`;
    w.appendChild(div);
  });
}

function renderSocials() {
  const g = document.getElementById('social-links-wrap');
  if (!g) return;
  SOCIALS.forEach(s => {
    const a = document.createElement('a');
    a.className = 'social-link'; a.href = s.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = s.label;
    g.appendChild(a);
  });
}

/* ═════════════════════════════════
   REGISTER PAGE
   ═════════════════════════════════ */

let selTicket   = null;
let selAwards   = [];
let pitchFiles  = [];
let currentReg  = null;
let selPayMethod = 'upi';

/* Ticket selection */
function initTicketCards() {
  document.querySelectorAll('.ticket-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.ticket-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selTicket = card.dataset.ticket;
      document.getElementById('ticket-err')?.remove();
      updateAwardStep();
      updateSummary();
    });
  });
}

function updateAwardStep() {
  const step = document.getElementById('step-awards');
  if (!step) return;
  step.style.display = selTicket === 'award' ? 'block' : 'none';
}

/* Award tag selector — rendered by sector */
function renderRegAwards() {
  const container = document.getElementById('award-sectors-reg');
  if (!container) return;
  AWARD_SECTORS.forEach(sector => {
    const div = document.createElement('div');
    div.className = 'award-sector';
    const isEco = sector.type === 'eco';
    div.innerHTML = `
      <div class="award-sector-title">
        <span class="sector-icon">${sector.icon}</span>
        <span>${sector.label}</span>
        <span class="sector-count">${sector.cats.length}</span>
        ${isEco ? '<span class="badge badge-rose" style="margin-left:auto;">Ecosystem</span>' : ''}
      </div>
      <div class="award-tags-wrap" id="sector-${sector.id}"></div>`;
    container.appendChild(div);

    const wrap = document.getElementById('sector-' + sector.id);
    sector.cats.forEach(cat => {
      const tag = document.createElement('div');
      tag.className = 'award-sel-tag' + (isEco ? ' eco-t' : '');
      tag.innerHTML = `<span class="tag-check">○</span><span class="tag-text">${cat}</span>`;
      tag.dataset.cat = cat;
      tag.addEventListener('click', () => {
        const on = tag.classList.toggle('on');
        tag.querySelector('.tag-check').textContent = on ? '●' : '○';
        if (on) {
          if (selAwards.length >= 5) {
            tag.classList.remove('on');
            tag.querySelector('.tag-check').textContent = '○';
            showAwardLimitToast();
            return;
          }
          selAwards.push(cat);
        } else {
          selAwards = selAwards.filter(a => a !== cat);
        }
        document.getElementById('award-err')?.remove();
        updateSummary();
      });
      wrap.appendChild(tag);
    });
  });
}

function showAwardLimitToast() {
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#2a0940;border:1px solid #c9952a;color:#f0dfc8;padding:12px 24px;border-radius:6px;font-size:.9rem;z-index:999;box-shadow:0 4px 20px rgba(0,0,0,.5);`;
  t.textContent = 'Maximum 5 award categories allowed per registration.';
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

/* Summary sidebar */
function updateSummary() {
  const ticket = TICKET_TYPES[selTicket];
  const qty = selTicket === 'award' ? Math.max(1, selAwards.length) : 1;
  const total = ticket ? ticket.price * qty : 0;

  const el = id => document.getElementById(id);
  if (el('sum-pass'))   el('sum-pass').textContent   = ticket ? ticket.label : '—';
  if (el('sum-qty'))    el('sum-qty').textContent    = selTicket === 'award' ? `×${qty} ${qty === 1 ? 'category' : 'categories'}` : '×1';
  if (el('sum-unit'))   el('sum-unit').textContent   = ticket ? '₹' + ticket.price.toLocaleString('en-IN') + ' each' : '—';
  if (el('sum-total'))  el('sum-total').textContent  = total ? '₹' + total.toLocaleString('en-IN') : '—';
  if (el('sum-award-list')) {
    if (selAwards.length > 0) {
      el('sum-award-list').innerHTML = selAwards.map(a => `<li style="font-size:.8125rem;color:var(--gold);padding:3px 0;border-bottom:1px solid var(--gold-lt);">${a}</li>`).join('');
      el('sum-award-list').parentElement.style.display = 'block';
    } else {
      el('sum-award-list').parentElement.style.display = 'none';
    }
  }
}

/* Validation */
function vField(inputId, wrapId, fn) {
  const val = document.getElementById(inputId).value.trim();
  const wrap = document.getElementById(wrapId);
  const ok = fn(val);
  wrap.classList.toggle('error', !ok);
  return ok;
}

function handleSubmit() {
  let ok = true;
  ok = vField('f-fn',  'w-fn',  v => v.length > 0) && ok;
  ok = vField('f-ln',  'w-ln',  v => v.length > 0) && ok;
  ok = vField('f-em',  'w-em',  v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) && ok;
  ok = vField('f-ph',  'w-ph',  v => v.length > 5) && ok;
  ok = vField('f-org', 'w-org', v => v.length > 0) && ok;
  ok = vField('f-des', 'w-des', v => v.length > 0) && ok;
  ok = vField('f-cty', 'w-cty', v => v.length > 0) && ok;
  ok = vField('f-sec', 'w-sec', v => v !== '') && ok;

  if (!selTicket) {
    document.getElementById('ticket-err')?.remove();
    const err = document.createElement('p');
    err.id = 'ticket-err'; err.style.cssText = 'color:var(--red);font-size:.875rem;margin-top:10px;';
    err.textContent = 'Please select a pass to continue.';
    document.getElementById('ticket-stack')?.appendChild(err);
    ok = false;
  }

  if (selTicket === 'award' && selAwards.length === 0) {
    document.getElementById('award-err')?.remove();
    const err = document.createElement('p');
    err.id = 'award-err'; err.style.cssText = 'color:var(--red);font-size:.875rem;margin-top:10px;';
    err.textContent = 'Please select at least one award category.';
    document.getElementById('award-sectors-reg')?.after(err);
    ok = false;
  }

  if (!document.getElementById('f-terms').checked) {
    alert('Please agree to the Terms & Conditions to proceed.'); ok = false;
  }

  if (!ok) {
    document.querySelector('.field.error, #ticket-err')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const ticket = TICKET_TYPES[selTicket];
  const qty = selTicket === 'award' ? selAwards.length : 1;

  currentReg = {
    firstname:   document.getElementById('f-fn').value.trim(),
    lastname:    document.getElementById('f-ln').value.trim(),
    email:       document.getElementById('f-em').value.trim(),
    phone:       document.getElementById('f-ph').value.trim(),
    org:         document.getElementById('f-org').value.trim(),
    designation: document.getElementById('f-des').value.trim(),
    city:        document.getElementById('f-cty').value.trim(),
    sector:      document.getElementById('f-sec').value,
    referral:    document.getElementById('f-ref').value,
    notes:       document.getElementById('f-notes').value.trim(),
    newsletter:  document.getElementById('f-news').checked,
    ticket:      selTicket,
    awards:      selAwards.slice(),
    amount:      ticket.price * qty,
    qty,
  };

  openPayModal();
}

/* ═════════════════════════════════
   PAYMENT MODAL
   ═════════════════════════════════ */

function openPayModal() {
  const reg = currentReg;
  document.getElementById('pm-name').textContent   = reg.firstname + ' ' + reg.lastname;
  document.getElementById('pm-pass').textContent   = TICKET_TYPES[reg.ticket].label;
  document.getElementById('pm-qty').textContent    = reg.ticket === 'award' ? `×${reg.qty} categories` : '×1 person';
  document.getElementById('pm-total').textContent  = '₹' + reg.amount.toLocaleString('en-IN');
  document.getElementById('pay-form').style.display = 'block';
  document.getElementById('pay-spin').style.display = 'none';
  setPayMethod('upi');
  document.getElementById('payment-modal').classList.add('open');
}

function closePayModal() {
  document.getElementById('payment-modal').classList.remove('open');
}

function setPayMethod(m) {
  selPayMethod = m;
  document.querySelectorAll('.pay-method').forEach(el => el.classList.toggle('active', el.dataset.m === m));
  ['upi','card','bank'].forEach(t => {
    const el = document.getElementById('pay-' + t);
    if (el) el.style.display = t === m ? 'flex' : 'none';
  });
}

function processPayment() {
  document.getElementById('pay-form').style.display = 'none';
  document.getElementById('pay-spin').style.display = 'block';
  setTimeout(finaliseReg, 2400);
}

/* ═════════════════════════════════
   FINALISE → RECEIPT
   ═════════════════════════════════ */

async function finaliseReg() {
  closePayModal();
  
  const reg = { ...currentReg };
  reg.id        = 'WPSA26-' + Math.random().toString(36).slice(2,8).toUpperCase();
  reg.status    = 'confirmed';
  reg.payMethod = selPayMethod || 'upi';
  reg.checkedIn = false;
  reg.pitchFiles = [];
  reg.timestamp = new Date().toISOString();

  console.log('💾 Saving registration...', reg);

  // FORCE SAVE - Try Firebase, then fallback
  try {
    await DB.saveReg(reg);
    console.log('%c✅ Saved to Firebase!', 'color:#4caf50;font-weight:bold');
  } catch (e) {
    console.warn('Firebase save failed, using localStorage...', e);
    try {
      let regs = JSON.parse(localStorage.getItem('wpsa_regs') || '[]');
      regs.push(reg);
      localStorage.setItem('wpsa_regs', JSON.stringify(regs));
      console.log('%c✅ Saved using localStorage fallback', 'color:#ff9800');
    } catch (e2) {
      console.error('All save attempts failed', e2);
    }
  }

  // Show success screen
  document.getElementById('reg-form-wrap').style.display = 'none';
  document.getElementById('reg-success').style.display   = 'block';
  renderReceipt(reg);
  document.getElementById('receipt-wrap').classList.add('show');

  if (reg.ticket === 'startup') {
    document.getElementById('pitch-panel').classList.add('show');
  }

  // FIX-5: keep currentReg so printReceipt/downloadReceiptTxt work after payment
  currentReg = reg;
}

/* ═════════════════════════════════
   QR SVG (deterministic visual)
   ═════════════════════════════════ */

function makeQR(data) {
  const hash = n => [...data].reduce((h,c) => ((h << 5) - h + c.charCodeAt(0)) | 0, n);
  const size = 21; const cells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inFP = (r < 7 && c < 7) || (r < 7 && c >= size-7) || (r >= size-7 && c < 7);
      const isTimingR = r === 6, isTimingC = c === 6;
      let bit;
      if (inFP) bit = (r===0||r===6||c===0||c===6)||(r>=2&&r<=4&&c>=2&&c<=4);
      else if (isTimingR || isTimingC) bit = (r+c)%2===0;
      else bit = (Math.abs(hash(r*size+c)*2654435761)|0) % 3 === 0;
      if (bit) cells.push(`<rect x="${c*4}" y="${r*4}" width="4" height="4"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 84 84" style="background:#fff;padding:6px;border-radius:4px;width:108px;height:108px;display:block;margin:0 auto;"><g fill="#c9952a">${cells.join('')}</g></svg>`;
}

function renderReceipt(reg) {
  const ticket = TICKET_TYPES[reg.ticket];
  const el = id => document.getElementById(id);
  el('rcpt-qr').innerHTML    = makeQR(reg.id + '|' + reg.email);
  el('rcpt-id').textContent  = reg.id;
  el('rcpt-name').textContent = reg.firstname + ' ' + reg.lastname;
  el('rcpt-email').textContent = reg.email;
  el('rcpt-org').textContent  = reg.org;
  el('rcpt-pass').textContent = ticket.label;
  el('rcpt-amt').textContent  = '₹' + reg.amount.toLocaleString('en-IN');
  el('rcpt-pay').textContent  = reg.payMethod.toUpperCase();
  el('rcpt-date').textContent = new Date(reg.timestamp).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
  if (reg.awards.length > 0) {
    el('rcpt-awards-row').style.display = '';
    el('rcpt-awards').textContent = reg.awards.join(' · ');
  }
}

function printReceipt() {
  const html = document.getElementById('receipt-wrap').innerHTML;
  const w = window.open('','_blank','width=640,height=900');
  w.document.write(`<!DOCTYPE html><html><head><title>WPSA 2026 Receipt — ${currentReg?.id||''}</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,sans-serif;background:#0e0115;color:#e8d8c8;padding:32px}
  .receipt-box{max-width:480px;margin:0 auto;border:1px solid #c9952a;border-radius:8px;overflow:hidden}
  .receipt-head{background:linear-gradient(135deg,#2a0940,#380c55);padding:28px;text-align:center;border-bottom:1px solid #c9952a}
  .receipt-head img{height:40px;margin:0 auto 12px}
  .receipt-head h3{font-family:Playfair Display,serif;font-size:1.2rem;color:#fdf8f2;margin-bottom:4px}
  .receipt-head p{font-size:.8rem;color:#c9952a}
  .receipt-body{padding:24px;background:#1f062f}
  .receipt-qr-wrap{text-align:center;margin-bottom:18px}
  .receipt-row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid rgba(201,149,42,.18);font-size:.875rem}
  .receipt-row:last-child{border-bottom:none}
  .rl{color:#906878}.rv{color:#fdf8f2;font-weight:600;text-align:right;word-break:break-word;max-width:280px}
  .receipt-foot{padding:16px;background:#2a0940;text-align:center;font-size:.8rem;color:#604858;line-height:1.8}
  .btn{display:block;margin:24px auto 0;padding:13px 36px;background:#c9952a;border:none;border-radius:3px;color:#0e0115;font-size:.8125rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;cursor:pointer}</style></head><body>
  ${html}<button class="btn" onclick="window.print()">🖨 Print Receipt</button></body></html>`);
  w.document.close();
}

function downloadReceiptTxt() {
  const reg = currentReg;
  if (!reg) return;
  const ticket = TICKET_TYPES[reg.ticket];
  const text = [
    '╔' + '═'.repeat(48) + '╗',
    '║  WPSA 2026 — ENTRY RECEIPT' + ' '.repeat(21) + '║',
    '║  11th Annual Women Power Summit & Awards  ║',
    '╠' + '═'.repeat(48) + '╣',
    `║  Reg ID    : ${reg.id.padEnd(34)}║`,
    `║  Name      : ${(reg.firstname+' '+reg.lastname).slice(0,34).padEnd(34)}║`,
    `║  Email     : ${reg.email.slice(0,34).padEnd(34)}║`,
    `║  Org       : ${reg.org.slice(0,34).padEnd(34)}║`,
    `║  Pass      : ${ticket.label.slice(0,34).padEnd(34)}║`,
    `║  Amount    : ₹${String(reg.amount.toLocaleString('en-IN')).padEnd(33)}║`,
    `║  Payment   : ${reg.payMethod.toUpperCase().padEnd(34)}║`,
    `║  Status    : CONFIRMED${' '.repeat(26)}║`,
    reg.awards.length > 0 ? `║  Categories: ${reg.awards.slice(0,2).join(', ').slice(0,34).padEnd(34)}║` : null,
    '╠' + '═'.repeat(48) + '╣',
    '║  Date   : Saturday, 23rd May 2026         ║',
    '║  Time   : 09:30 AM – 06:00 PM IST         ║',
    '║  Venue  : NSE, BKC, Mumbai                ║',
    '╚' + '═'.repeat(48) + '╝',
    '',
    `Registered on: ${new Date(reg.timestamp).toLocaleString('en-IN')}`,
    'For queries: connect@billenniumdivas.fund',
    '#WPSA2026 · #BreakFree · #BeThePower',
  ].filter(l => l !== null).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  a.download = `WPSA2026-Receipt-${reg.id}.txt`;
  a.click();
}

/* ═════════════════════════════════
   PITCH UPLOAD
   ═════════════════════════════════ */

const PITCH_TYPES = ['.pdf','.ppt','.pptx','.key','.odp','.pps','.ppsx'];
const PITCH_MAX_MB = 50;

function initPitchUpload() {
  const zone  = document.getElementById('drop-zone');
  const input = document.getElementById('pitch-input');
  if (!zone || !input) return;
  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover',  e => { e.preventDefault(); zone.classList.add('over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('over'));
  zone.addEventListener('drop', e => { e.preventDefault(); zone.classList.remove('over'); addFiles([...e.dataTransfer.files]); });
  input.addEventListener('change', () => addFiles([...input.files]));
}

async function addFiles(files) {
  files.forEach(f => {
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!PITCH_TYPES.includes(ext)) { alert(`"${ext}" not allowed. Accepted: ${PITCH_TYPES.join(', ')}`); return; }
    if (f.size > PITCH_MAX_MB * 1024 * 1024) { alert(`Max file size is ${PITCH_MAX_MB} MB.`); return; }
    if (pitchFiles.some(x => x.name === f.name)) return;
    pitchFiles.push(f);
  });
  renderPitchFiles();
  /* Update registration record in DB */
  if (currentReg) {
    try {
      await DB.updateReg(currentReg.id, { pitchFiles: pitchFiles.map(f => f.name) });
      await DB.addLog({ email: currentReg.email, action: 'pitch_upload', status: 'success', note: `${pitchFiles.length} file(s) for ${currentReg.id}` });
    } catch (e) { console.error('[DB] Pitch update failed:', e); }
  }
}

function removePitchFile(i) {
  pitchFiles.splice(i, 1);
  renderPitchFiles();
}

function renderPitchFiles() {
  const list = document.getElementById('pitch-file-list');
  if (!list) return;
  list.innerHTML = '';
  pitchFiles.forEach((f, i) => {
    const div = document.createElement('div');
    div.className = 'pitch-file';
    div.innerHTML = `<div><div class="pitch-file-name">📎 ${f.name}</div><div class="pitch-file-size">${(f.size/1048576).toFixed(2)} MB</div></div><button class="pitch-file-del" onclick="removePitchFile(${i})">✕</button>`;
    list.appendChild(div);
  });
  const status = document.getElementById('pitch-status');
  if (status) status.textContent = pitchFiles.length > 0 ? `✅ ${pitchFiles.length} file(s) ready to submit` : '';
}

/* ═════════════════════════════════
   MOBILE NAV HAMBURGER
   ═════════════════════════════════ */

function initMobileNav() {
  const hamburger = document.getElementById('nav-hamburger');
  const mobileMenu = document.getElementById('nav-mobile-menu');
  if (!hamburger || !mobileMenu) return;
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });
  document.querySelectorAll('.nav-mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      showPage(link.dataset.page);
      document.querySelectorAll('.nav-mobile-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

/* ═════════════════════════════════
   INIT
   ═════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  // Auth/session gate
  const auth = DB.auth;
  const authEmailEl = document.getElementById('auth-modal');

  // Ensure auth UI modal is wired
  const authModal = document.getElementById('auth-modal');
  const authClose = document.getElementById('auth-close');
  const authErr = document.getElementById('auth-err');
  const authSubmit = document.getElementById('auth-submit-btn');
  const authSwitchReg = document.getElementById('auth-switch-reg');
  const authMode = () => authModal?.dataset?.mode === 'register' ? 'register' : 'login';

  const showAuthErr = (msg) => {
    if (!authErr) return;
    authErr.textContent = msg;
    authErr.style.display = 'block';
  };

  const clearAuthErr = () => {
    if (!authErr) return;
    authErr.textContent = '';
    authErr.style.display = 'none';
  };

  const setAuthMode = (m) => {
    if (!authModal) return;
    authModal.dataset.mode = m;
    const title = document.getElementById('auth-modal-title');
    const sub = document.getElementById('auth-modal-sub');
    const nameRow = document.getElementById('auth-name-row');
    if (title) title.textContent = m === 'register' ? 'Create your free account' : 'Sign In to Continue';
    if (sub) sub.textContent = m === 'register'
      ? 'Create an account to access registration, receipt download, and PitchPower uploads.'
      : 'Log in to access your registration or apply for WPSA 2026.';
    if (nameRow) nameRow.style.display = m === 'register' ? 'grid' : 'none';
    if (authSubmit) authSubmit.textContent = m === 'register' ? 'Create account →' : 'Sign In →';
  };

  const openAuth = (m = 'login') => {
    setAuthMode(m);
    authModal?.classList.add('open');
  };
  const closeAuth = () => authModal?.classList.remove('open');

  authClose?.addEventListener('click', closeAuth);
  authModal?.addEventListener('click', (e) => {
    if (e.target === authModal) closeAuth();
  });

  // Default mode
  setAuthMode('login');

  // Switch login/register
  authSwitchReg?.addEventListener('click', () => {
    const m = authMode();
    setAuthMode(m === 'login' ? 'register' : 'login');
  });

  // Firebase Auth handlers
  let currentUser = null;
  if (auth && typeof firebase !== 'undefined') {
    firebase.auth().onAuthStateChanged((u) => {
      currentUser = u;
      // Persist UI state for pitch + receipt access
      if (u?.email) {
        sessionStorage.setItem('wpsa_user_email', u.email);
      } else {
        sessionStorage.removeItem('wpsa_user_email');
      }
    });
  }

await firebase.auth().setPersistence(
  firebase.auth.Auth.Persistence.NONE
);

  const signIn = async () => {
    clearAuthErr();
    const email = (document.getElementById('auth-email')?.value || '').trim();
    const password = (document.getElementById('auth-pass')?.value || '').trim();
    if (!email || !password) { showAuthErr('Email and password are required.'); return; }

    try {
      if (!DB.auth) throw new Error('Firebase Auth not configured');
      const cred = await firebase.auth().signInWithEmailAndPassword(email, password);

const user = cred.user;

sessionStorage.setItem('wpsa_user_email', user.email || '');

if (isAdminUser(user)) {
  sessionStorage.setItem('wpsa_admin', 'true');
} else {
  sessionStorage.removeItem('wpsa_admin');
}

// Small auth sync delay
await new Promise(r => setTimeout(r, 300));

try {
  await DB.addLog({
    email,
    action: 'login',
    status: 'success',
    note: isAdminUser(user)
      ? 'Admin signed in'
      : 'User signed in',
    adminOnly: true
  });
} catch (err) {
  console.warn('Login log failed:', err);
}
      closeAuth();

/* =========================
   ADMIN REDIRECT
========================= */

if (isAdminUser(user)) {

  console.log('Admin detected → redirecting');

  window.location.href = 'admin.html';

  return;
}

/* Normal users */

showPage('register');
    } catch (e) {
      showAuthErr(e?.message || 'Sign in failed. Please try again.');
      const emailFallback = (document.getElementById('auth-email')?.value || '').trim();
      try {
  await DB.addLog({
    email: emailFallback || 'unknown',
    action: 'login_failed',
    status: 'failed',
    note: (e && e.code) ? e.code : 'error',
    adminOnly: true
  });
} catch (err) {
  console.warn('Failed login log failed:', err);
}
    }
  };

  const signUp = async () => {
    clearAuthErr();
    const email = (document.getElementById('auth-email')?.value || '').trim();
    const password = (document.getElementById('auth-pass')?.value || '').trim();
    const fname = (document.getElementById('auth-fname')?.value || '').trim();
    const lname = (document.getElementById('auth-lname')?.value || '').trim();

    if (!email || !password || !fname || !lname) { showAuthErr('Please fill all required fields.'); return; } 

    try {
      if (!DB.auth) throw new Error('Firebase Auth not configured');
      const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
      const u = cred.user;

      // Save user profile mirror into DB
      await DB.saveUser({
        uid: u.uid,
        email: u.email,
        firstname: fname,
        lastname: lname,
        displayName: `${fname} ${lname}`.trim(),
        createdAt: new Date().toISOString(),
      });

      try {
  await DB.addLog({
    email,
    action: 'register',
    status: 'success',
    note: 'User registered',
    adminOnly: true
  });
} catch (err) {
  console.warn('Signup log failed:', err);
}

      // After signup, proceed to sign in session
      closeAuth();
      showPage('register');
    } catch (e) {
      showAuthErr(e?.message || 'Create account failed.');
      try {
  await DB.addLog({
    email: email || 'unknown',
    action: 'register_failed',
    status: 'failed',
    note: (e && e.code) ? e.code : 'error',
    adminOnly: true
  });
} catch (err) {
  console.warn('Register failed log failed:', err);
}
    }
  }

  authSubmit?.addEventListener('click', async () => {
    const m = authMode();
    if (m === 'register') await signUp(); else await signIn();
  });

  // When auth modal opens from Register button, store desired post-login target
  const pendingTarget = () => sessionStorage.getItem('wpsa_pending_target');
  const setPendingTarget = (v) => sessionStorage.setItem('wpsa_pending_target', v);

  document.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', () => {
    const target = l.dataset.page;
    if (target === 'register') {
      const isAuthed = !!(sessionStorage.getItem('wpsa_user_email') || (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length && firebase.auth().currentUser));
      if (!isAuthed) { setPendingTarget('register'); openAuth('login'); return; }
    }
    showPage(target);
  }));

  document.getElementById('nav-cta')?.addEventListener('click', () => {
    const isAuthed = !!(sessionStorage.getItem('wpsa_user_email') || (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length && firebase.auth().currentUser));
    if (!isAuthed) { setPendingTarget('register'); openAuth('login'); return; }
    showPage('register');
  });
  
  document.getElementById('nav-auth-btn')?.addEventListener('click', () => {
    const isAuthed = !!(sessionStorage.getItem('wpsa_user_email') || (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length && firebase.auth().currentUser));
    if (!isAuthed) { setPendingTarget('register'); openAuth('login'); return; }
    showPage('register');
  });

  initMobileNav();


  /* Hero buttons */
  document.getElementById('hero-apply')?.addEventListener('click', () => showPage('register'));
  document.getElementById('hero-schedule')?.addEventListener('click', () => {
    showPage('home');
    setTimeout(() => document.getElementById('schedule')?.scrollIntoView({ behavior:'smooth', block:'start' }), 120);
  });
  document.getElementById('pricing-apply')?.addEventListener('click', () => showPage('register'));

  /* Award filter (home) */
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderHomeAwards(btn.dataset.filter);
    });
  });

  /* Dynamic renders */
  renderHomeAwards();
  renderSchedule();
  renderJury();
  renderGallery();
  renderPartners();
  renderSocials();
  renderRegAwards();
  startCountdown();
  initTicketCards();
  initPitchUpload();
  updateAwardStep();
  updateSummary();

  /* Register submit */
  document.getElementById('submit-btn')?.addEventListener('click', handleSubmit);

  /* Payment methods */
  document.querySelectorAll('.pay-method').forEach(el => el.addEventListener('click', () => setPayMethod(el.dataset.m)));
  document.getElementById('pay-confirm')?.addEventListener('click', processPayment);
  document.getElementById('pay-close')?.addEventListener('click', closePayModal);

  /* Receipt actions */
  document.getElementById('rcpt-print')?.addEventListener('click', printReceipt);
  document.getElementById('rcpt-dl')?.addEventListener('click', downloadReceiptTxt);

  showPage('home');

  /* =========================
   AUTH STATE LISTENER
========================= */
if (typeof firebase !== 'undefined' && firebase.auth) {

firebase.auth().onAuthStateChanged((user) => {

  const signInBtn = document.querySelector('#nav-auth-btn');
  const userPanel = document.querySelector('#user-panel');
  const userEmail = document.querySelector('#user-email');
  const logoutBtn = document.querySelector('#logout-btn');
  const authModal = document.querySelector('#auth-modal');

  if (user) {

    console.log('Logged in:', user.email);

    sessionStorage.setItem(
      'wpsa_user_email',
      user.email || ''
    );

    if (isAdminUser(user)) {

      sessionStorage.setItem(
        'wpsa_admin',
        'true'
      );

    } else {

      sessionStorage.removeItem(
        'wpsa_admin'
      );

    }

    // Close auth modal
    if (authModal) {
      authModal.classList.remove('open');
    }

    // Hide sign in button
    if (signInBtn) {
      signInBtn.style.display = 'none';
    }

    // Show user panel
    if (userPanel) {
      userPanel.style.display = 'flex';
    }

    // Show email
    if (userEmail) {
      userEmail.textContent = user.email || 'User';
    }

    // Logout button
    if (logoutBtn && !logoutBtn.dataset.bound) {

      logoutBtn.dataset.bound = 'true';

      logoutBtn.addEventListener('click', async () => {

        try {

          await firebase.auth().signOut();

          sessionStorage.removeItem('wpsa_admin');
          sessionStorage.removeItem('wpsa_user_email');

          window.location.href = 'index.html';

        } catch (e) {

          console.error('Logout failed:', e);

        }

      });

    }

    document.body.classList.add('logged-in');

  } else {

    console.log('User signed out');

    sessionStorage.removeItem('wpsa_admin');
    sessionStorage.removeItem('wpsa_user_email');

    // Show sign in button
    if (signInBtn) {
      signInBtn.style.display = 'inline-flex';
    }

    // Hide user panel
    if (userPanel) {
      userPanel.style.display = 'none';
    }

    // Clear email
    if (userEmail) {
      userEmail.textContent = '';
    }

    document.body.classList.remove('logged-in');

  }

});

}
});