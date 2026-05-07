# WPSA 2026 — Asset & Setup Guide

## Quick Start
1. Unzip the folder
2. Run the curl commands below to download images
3. Open index.html in a browser
4. For admin: click "Organiser ⚙" → password: wpsa2026admin

## Download All Assets (run from project root)
```bash
mkdir -p assets/img
curl -L "https://www.womenpowersummit.in/assets/img/logo/Logo%20Full%20Color.png" -o assets/img/logo.png
curl -L "https://www.womenpowersummit.in/assets/img/new_images/21.jpeg"           -o assets/img/hero-banner.jpg
cp assets/img/logo.png assets/img/favicon.png
echo "✅ Assets ready"
```

## Admin Password
Default: wpsa2026admin
Change in js/main.js → const ADMIN_PASS = '...'

## Production Checklist
- [ ] Replace demo payment with Razorpay / PayU / Cashfree
- [ ] Change admin password
- [ ] Host on HTTPS server (required for file uploads)
- [ ] Connect backend API to store registrations server-side
