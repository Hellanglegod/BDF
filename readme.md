# Women Power Summit & Awards 2026

**11th Annual Edition — 23rd May 2026 · NSE, Bandra Kurla Complex, Mumbai**
Powered by [Billennium Divas](https://www.billenniumdivas.fund)

---

## Project Structure

```
/
├── index.html       — Public site (home, location, partners, registration)
├── admin.html       — Organiser panel (login-protected)
├── main.js          — Public site logic (auth, registration, payment, pitch upload)
├── admin.js         — Admin panel logic (dashboard, login logs, check-in, settings)
├── styles.css       — Public site styles
├── admin.css        — Admin panel styles
└── assets/          — Images, favicon, logo (create this folder locally)
    └── img/
        ├── logo.png
        ├── favicon.png
        └── hero-banner.jpg
```

---

## Deploying to GitHub Pages

### Prerequisites

- A GitHub account
- Git installed on your computer ([download](https://git-scm.com/downloads))
- The project files on your local machine

---

### Step 1 — Create a GitHub Repository

1. Go to [github.com](https://github.com) and sign in.
2. Click **New** (or the **+** icon → **New repository**).
3. Set the repository name — for example: `wpsa2026`
4. Set visibility to **Public** (required for free GitHub Pages).
5. Leave all other options at their defaults and click **Create repository**.

---

### Step 2 — Push the Project Files

Open a terminal in the project folder and run:

```bash
git init
git add .
git commit -m "Initial commit — WPSA 2026 site"
git branch -M main
git remote add origin https://github.com/Hellanglegod/BDF.git
git push -u origin main
```

Replace `YOUR-USERNAME` and `wpsa2026` with your actual GitHub username and repository name.

---

### Step 3 — Enable GitHub Pages

1. In your repository, go to **Settings** → **Pages** (left sidebar).
2. Under **Source**, select **Deploy from a branch**.
3. Set the branch to **main** and the folder to **/ (root)**.
4. Click **Save**.

GitHub will build and publish your site. After about 1–2 minutes your site will be live at:

```
https://YOUR-USERNAME.github.io/wpsa2026/
```

---

### Step 4 — Update Internal Links (if needed)

If any internal links break because the site is served from a subdirectory (e.g. `/wpsa2026/`), update relative paths in `index.html` and `admin.html`:

```html
<!-- Before -->
<link rel="stylesheet" href="styles.css"/>
<script src="main.js"></script>

<!-- After (if repo name is wpsa2026) — usually not needed for same-folder assets -->
<link rel="stylesheet" href="styles.css"/>
<script src="main.js"></script>
```

All asset paths in this project are already relative, so no changes are typically required.

---

### Step 5 — Add a Custom Domain (Optional)

1. Purchase a domain (e.g. `event.billenniumdivas.fund`).
2. In your domain registrar, add a **CNAME** DNS record:
   - **Name/Host:** `www` (or `@` for apex)
   - **Value:** `YOUR-USERNAME.github.io`
3. In the repository **Settings → Pages**, enter the custom domain and click **Save**.
4. Check **Enforce HTTPS** once the certificate has been issued (can take up to 24 hours).

---

### Updating the Site

After making changes locally, push them to GitHub:

```bash
git add .
git commit -m "Update: Fixed path"
git push
```

GitHub Pages automatically redeploys within 1–2 minutes of each push to `main`.

---

## Admin Panel

The organiser panel is available at `/admin.html`.

**Default password:** `wpsa2026@admin`

To change the password, edit line 7 of `admin.js`:

```js
const ADMIN_PASS = 'wpsa2026@admin';  // ← change this
```

> **Note:** Because this is a static site, the admin password is stored in plain JavaScript. For a production deployment with sensitive data, replace the local-storage backend with a proper server-side API.

---

## Data Storage

All registrations, user accounts, settings, and login logs are stored in the visitor's browser **localStorage**. This means:

- Data is **per-browser** and is not shared between devices.
- Clearing browser data will erase all registrations.
- For multi-device access or a shared event database, integrate a backend service (e.g. Netlify Functions + a database, or Firebase).

---

## Key Features

| Feature | Details |
|---|---|
| User auth | Register/login required before accessing the registration form |
| Session persistence | Returning logged-in users automatically see their receipt and pitch upload |
| Admin login logs | Every sign-in attempt (user & admin) is recorded in the Login Logs tab |
| Receipt & QR code | Auto-generated on payment confirmation; downloadable as text |
| Pitch deck upload | Available to PitchPower registrants after payment |
| Admin check-in | Search by email or registration ID; one-click check-in |
| CSV export | Download all registrations as a spreadsheet |

---

## Contact

**Billennium Divas Private Limited**
Email: [connect@billenniumdivas.fund](mailto:connect@billenniumdivas.fund)
Website: [billenniumdivas.fund](https://www.billenniumdivas.fund)

`#WPSA2026 · #BreakFree · #BeThePower`
