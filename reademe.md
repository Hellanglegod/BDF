# Women Power Summit & Awards 2026
**11th Annual Edition — 23rd May 2026 · NSE, Bandra Kurla Complex, Mumbai**
Powered by [Billennium Divas](https://www.billenniumdivas.fund)

---

## What's in this repo

| File | Purpose |
|---|---|
| `index.html` | Public site — Home, Location, Partners, Register |
| `admin.html` | Organiser panel — **not linked from the site**, access via URL only |
| `js/firebase-config.js` | ⚠️ **Fill this in** — your Firebase project credentials |
| `js/db.js` | Data layer — writes to Firebase; falls back to `localStorage` if unconfigured |
| `js/main.js` | Public site logic — auth, registration, payment, receipts, pitch upload |
| `js/admin.js` | Admin panel logic — dashboard, login logs, check-in, CSV export, settings |
| `css/styles.css` | Public site styles |
| `css/admin.css` | Admin panel styles |
| `assets/img/` | Logo, favicon, hero banner (download with the one-liner below) |

---

## ⚡ 60-Second Local Setup

```bash
# 1. Download images (run once from the project root)
mkdir -p assets/img
curl -sL "https://www.womenpowersummit.in/assets/img/logo/Logo%20Full%20Color.png" -o assets/img/logo.png
curl -sL "https://www.womenpowersummit.in/assets/img/new_images/21.jpeg"           -o assets/img/hero-banner.jpg
cp assets/img/logo.png assets/img/favicon.png
echo "✅ Assets ready"

# 2. Open in browser
open index.html        # macOS
# xdg-open index.html  # Linux
# start index.html     # Windows
```

The site works immediately in demo mode — all data goes to `localStorage`.
**To make data shared across devices, complete the Firebase setup below.**

---

## 🔥 Firebase Setup (shared, multi-device database)

This is the fix for the single-browser limitation. Once connected, every
registration, login log, and setting is stored in Firebase Firestore and
is accessible from any device in real time.

### Step 1 — Create a Firebase project

1. Go to **[console.firebase.google.com](https://console.firebase.google.com)**
2. Click **Add project** → name it e.g. `wpsa2026`
3. Disable Google Analytics (not needed) → **Create project**

### Step 2 — Register a web app

1. In the project overview, click the **`</>`** (Web) icon
2. App nickname: `WPSA 2026` → click **Register app**
3. You'll see a `firebaseConfig` object — **keep this page open**

### Step 3 — Fill in `js/firebase-config.js`

Open `js/firebase-config.js` and replace the placeholder values:

```js
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSy...",           // ← paste your values
  authDomain:        "wpsa2026.firebaseapp.com",
  projectId:         "wpsa2026",
  storageBucket:     "wpsa2026.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc123",
};

const ADMIN_PASS = "choose-a-strong-password"; // ← change this!
```

### Step 4 — Enable Firestore

1. Left sidebar → **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** → select a region close to India (e.g. `asia-south1`) → **Enable**
4. Go to the **Rules** tab and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Registrations: anyone can create; only the owner can read their own
    match /registrations/{docId} {
      allow create: if request.auth != null;
      allow read, update: if request.auth != null &&
        (resource.data.email == request.auth.token.email ||
         request.auth.token.admin == true);
    }

    // Login logs: write-only for authenticated users
    match /loginLogs/{docId} {
      allow create: if request.auth != null;
      allow read:   if request.auth.token.admin == true;
    }

    // Settings: admin only
    match /settings/{docId} {
      allow read, write: if request.auth.token.admin == true;
    }

    // Users: owner can read their own profile
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }

    // Pitch file metadata
    match /pitchFiles/{regId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

5. Click **Publish**

### Step 5 — Enable Authentication

1. Left sidebar → **Build → Authentication**
2. Click **Get started**
3. Under **Sign-in method**, enable **Email/Password** → **Save**

### Step 6 — (Optional) Enable Storage for pitch file uploads

1. Left sidebar → **Build → Storage**
2. Click **Get started** → production mode → choose region → **Done**
3. In `js/firebase-config.js`, set `USE_STORAGE_FOR_PITCH = true`

---

## 🔑 Admin Panel

The admin panel lives at `/admin.html`.
**There is no link to it from the public site** — share the URL privately.

| Setting | Where to change |
|---|---|
| Admin password | `js/firebase-config.js` → `ADMIN_PASS` |
| Agenda text sent to attendees | Admin panel → Settings tab |
| Pitch upload deadline | Admin panel → Settings tab |
| Email subject line | Admin panel → Settings tab |

### What the admin panel shows

- **Registrations** — full table, search/filter, check-in toggle, receipt popup, CSV export
- **Check-In** — look up by registration ID or email, one-click mark as arrived
- **Pitches** — all PitchPower decks uploaded by startups
- **Login Logs** — every login, registration, ticket download, pitch upload — with timestamps and status
- **Users** — all created accounts
- **Settings** — customise agenda, email subject, pitch deadline

---

## 🚀 Deploy to GitHub Pages

### Prerequisites
- A GitHub account
- Git installed ([download](https://git-scm.com/downloads))

### Step 1 — Create the repository

1. Go to **[github.com/new](https://github.com/new)**
2. Repository name: `wpsa2026` (or any name)
3. Set to **Public** (required for free GitHub Pages)
4. Leave everything else at defaults → **Create repository**

### Step 2 — Push the code

In a terminal, inside the project folder:

```bash
git init
git add .
git commit -m "Initial commit — WPSA 2026 site"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/wpsa2026.git
git push -u origin main
```

Replace `YOUR-USERNAME` and `wpsa2026` with your GitHub username and repo name.

### Step 3 — Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → scroll to **Pages** (left sidebar)
3. Under **Source**, select **Deploy from a branch**
4. Branch: `main` · Folder: `/ (root)` → **Save**
5. Wait ~60 seconds, then your site is live at:

```
https://YOUR-USERNAME.github.io/wpsa2026/
```

### Step 4 — Configure Firebase for your domain

1. In Firebase Console → **Authentication → Settings → Authorized domains**
2. Click **Add domain** → paste `YOUR-USERNAME.github.io` → **Add**

That's it — Firebase will now accept auth requests from your GitHub Pages URL.

### Step 5 — Update when you make changes

```bash
git add .
git commit -m "update: describe what changed"
git push
```

GitHub Pages auto-deploys within ~30 seconds of every push.

---

## 📋 Pricing Reference

| Pass | Price | Notes |
|---|---|---|
| Award Nomination | ₹4,499 / category | Up to 5 categories · award categories are mandatory |
| Delegate Pass | ₹4,999 / person | No award nomination required |
| PitchPower | ₹5,000 / startup | Includes delegate access · pitch deck upload required |

## 📅 Key Dates

| Date | Milestone |
|---|---|
| 2nd May 2026 | Nomination deadline |
| 11th May 2026 | Top 3 shortlist announced |
| 15th May 2026 | Pitch deck upload deadline |
| 23rd May 2026 | Award Ceremony · NSE BKC Mumbai · 09:30 AM – 06:00 PM IST |

---

## 🏭 Production Checklist

- [ ] Fill in `js/firebase-config.js` with real Firebase credentials
- [ ] Change `ADMIN_PASS` in `js/firebase-config.js`
- [ ] Publish Firestore security rules (Step 4 above)
- [ ] Add your GitHub Pages domain to Firebase Authorized Domains
- [ ] Replace demo payment with [Razorpay](https://razorpay.com) / [PayU](https://payu.in) / [Cashfree](https://cashfree.com) — hook into the `processPayment()` function in `js/main.js`
- [ ] Add `robots.txt` with `Disallow: /admin.html`
- [ ] Test on mobile before event day

---

## 🗂 Full Asset Download (for offline use)

```bash
mkdir -p assets/img/jury assets/img/gallery

# Core
curl -sL "https://www.womenpowersummit.in/assets/img/logo/Logo%20Full%20Color.png" -o assets/img/logo.png
curl -sL "https://www.womenpowersummit.in/assets/img/new_images/21.jpeg"           -o assets/img/hero-banner.jpg
cp assets/img/logo.png assets/img/favicon.png

# Jury photos
for pair in SS:SS.jpg AT:AT.jpeg MS:MS.jpg RR:RR.png TC:TC.jpg AS:AS.jpg SSG:SSG.jpeg CO:CO.png RB:RB.jpg AB:AB.jpg JT:JT.jpeg DM:DM.jpg; do
  k=${pair%%:*}; f=${pair##*:}
  curl -sL "https://www.womenpowersummit.in/assets/img/new_images/$f" -o "assets/img/jury/$k.jpg"
done

# Gallery
i=1
for img in new_images/2.png extras/NewGallery_1.webp extras/NewGallery_2.webp \
  "extras/20250530_111055_0000.webp" "extras/20250530_111055_0002.webp" \
  "extras/20250530_111903_0000.webp" new_images/3.png new_images/4.png new_images/5.png; do
  ext="${img##*.}"
  curl -sL "https://www.womenpowersummit.in/assets/img/$img" \
       -o "assets/img/gallery/gallery-$(printf '%02d' $i).$ext"
  i=$((i+1))
done
echo "✅ All assets downloaded."
```

---

## 💬 Contact

| | |
|---|---|
| Event queries | connect@billenniumdivas.fund |
| Website | [event.billenniumdivas.fund](https://event.billenniumdivas.fund) |
| Register | [bit.ly/wpsa2026](https://bit.ly/wpsa2026) |

#WPSA2026 · #BreakFree · #BeThePower