# WPSA 2026 — Developer Setup Guide
## 11th Annual Women Power Summit & Awards | Billennium Divas

---

## ⚡ 30-Second Asset Setup (copy-paste this)

Open a terminal in the project root and run:

```bash
mkdir -p assets/img && \
curl -sL "https://www.womenpowersummit.in/assets/img/logo/Logo%20Full%20Color.png" -o assets/img/logo.png && \
curl -sL "https://www.womenpowersummit.in/assets/img/new_images/21.jpeg"           -o assets/img/hero-banner.jpg && \
cp assets/img/logo.png assets/img/favicon.png && \
echo "✅ Core assets ready. Open index.html in your browser."
```

That's all you need to get started. All jury photos and gallery images load directly from the live CDN. The site will work immediately.

---

## 📁 Project Structure

```
wpsa2026/
├── index.html          ← Main public site (Home / Location / Partners / Register)
├── admin.html          ← Organiser panel (NO link from index.html — share URL directly)
├── css/
│   ├── styles.css      ← Main site stylesheet (full-width, mobile-first, Inter + Playfair)
│   └── admin.css       ← Admin panel stylesheet (standalone)
├── js/
│   ├── main.js         ← Site logic: tabs, countdown, form, payment, receipt, pitch upload
│   └── admin.js        ← Admin logic: login, registrations table, check-in, CSV export, settings
└── assets/
    ├── img/
    │   ├── logo.png          ← Billennium Divas logo (download with script above)
    │   ├── hero-banner.jpg   ← Hero background (download with script above)
    │   └── favicon.png       ← Copy of logo.png (or replace with 32×32 favicon)
    └── SETUP.md              ← This file
```

---

## 🔐 Admin Panel Access

- **URL:** `yoursite.com/admin.html`
- **Password:** `wpsa2026@admin`
- **There is deliberately NO link to admin.html from the public site.**

To change the password, edit line 3 of `js/admin.js`:
```js
const ADMIN_PASS = 'your-new-password-here';
```

---

## 💰 Accurate Pricing (as of May 2026)

| Pass | Price | Notes |
|------|-------|-------|
| Award Nomination | ₹4,499 / category | Up to 5 categories per person · Award categories are mandatory for this pass |
| Delegate Pass | ₹4,999 / person | No award categories required |
| PitchPower | ₹5,000 / startup | Includes delegate access · Pitch deck upload required after payment |

---

## 📅 Key Event Dates

| Date | Milestone |
|------|-----------|
| 2nd May 2026 | Nomination Deadline |
| 11th May 2026 | Top 3 Shortlist Announced |
| 15th May 2026 | Pitch Deck Upload Deadline |
| 23rd May 2026 | Award Ceremony · NSE BKC Mumbai · 09:30 AM – 06:00 PM IST |

---

## 🌐 Full Asset Download (optional — for fully offline hosting)

If you need the site to work without an internet connection:

```bash
# Create folders
mkdir -p assets/img/jury assets/img/gallery

# Logo & hero
curl -sL "https://www.womenpowersummit.in/assets/img/logo/Logo%20Full%20Color.png" -o assets/img/logo.png
curl -sL "https://www.womenpowersummit.in/assets/img/new_images/21.jpeg"           -o assets/img/hero-banner.jpg
cp assets/img/logo.png assets/img/favicon.png

# Jury photos
for f in SS:SS.jpg AT:AT.jpeg MS:MS.jpg RR:RR.png TC:TC.jpg AS:AS.jpg SSG:SSG.jpeg CO:CO.png RB:RB.jpg AB:AB.jpg JT:JT.jpeg DM:DM.jpg; do
  name="${f%%:*}"; file="${f##*:}"
  curl -sL "https://www.womenpowersummit.in/assets/img/new_images/$file" -o "assets/img/jury/$name.jpg"
done

# Gallery
i=1; for img in 2.png extras/NewGallery_1.webp extras/NewGallery_2.webp "extras/20250530_111055_0000.webp" "extras/20250530_111055_0002.webp" "extras/20250530_111903_0000.webp" 3.png 4.png 5.png; do
  curl -sL "https://www.womenpowersummit.in/assets/img/$img" -o "assets/img/gallery/gallery-$(printf '%02d' $i).${img##*.}"
  i=$((i+1))
done

echo "✅ All assets downloaded."
```

After running the full download, update the `img src` paths in `js/main.js` from CDN URLs to local paths like `assets/img/jury/SS.jpg`.

---

## 🔌 Production Checklist

- [ ] **Payment gateway** — Replace the demo `processPayment()` in `js/main.js` with your Razorpay / PayU / Cashfree SDK integration
- [ ] **Change admin password** — Edit `ADMIN_PASS` in `js/admin.js`
- [ ] **Backend storage** — Currently uses `localStorage`. For production, POST registrations to your backend API and replace `getRegs()` / `saveRegs()` calls with `fetch()` to your endpoint
- [ ] **Email sending** — Wire the `finaliseReg()` function to trigger an email via your backend (SendGrid / Postmark) using the `currentReg` object
- [ ] **HTTPS** — Required for file upload (pitch deck) functionality
- [ ] **robots.txt** — Add `Disallow: /admin.html` to prevent indexing of the admin panel
- [ ] **Favicon** — Replace `assets/img/favicon.png` with a proper 32×32 or 48×48 `.ico` or `.png`

---

## 🗺 Google Maps Embed (NSE BKC)

The correct verified embed URL for NSE, Bandra Kurla Complex, Mumbai is already in `index.html`:

```
https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.4278397085565!2d72.86247937489856!3d19.061697250021547!...!2s...!2sNational%20Stock%20Exchange%20of%20India%20Ltd.
```

---

## 💬 Contact

Event queries: [connect@billenniumdivas.fund](mailto:connect@billenniumdivas.fund)  
Website: [event.billenniumdivas.fund](https://event.billenniumdivas.fund)  
Register: [bit.ly/wpsa2026](https://bit.ly/wpsa2026)

\#WPSA2026 · #BreakFree · #BeThePower
