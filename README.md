# 🚑 Smart Ambulance Routing & Treatment-Ready Hospital Selection

[![Render Deploy](https://img.shields.io/badge/Deploy%20to-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Status: Online](https://img.shields.io/badge/Status-Operational-success?style=for-the-badge)]()

> **Our Motive:**  
> *“Right Patient. Right Hospital. Right Resources. Right Route. Minimum Delay.”*

---

## 🏛️ Project & Academic Information
- **Institution:** J.J. College of Engineering and Technology (Sowdambikaa Group of Institutions)
- **Accreditation:** Approved by AICTE | Affiliated to Anna University | ISO 9001:2008 Certified
- **Project Team:**
  - **Monika.R.K**
  - **Sahana.S**
  - **Rubini.P**
  - **Nigidha.B**

---

## 💡 The Core Innovation: Treatment Readiness Score (TRS)
Conventional emergency response sends ambulances to the geographically **nearest** hospital based on distance. However, that nearest hospital may lack ICU beds, required specialists, imaging equipment (CT scan/MRI), or cross-matched blood, triggering catastrophic secondary hospital transfers and delays.

Our system computes a **Multi-Criteria Decision Treatment Readiness Score (100%)**:

$$\text{Readiness Score} = \sum_{i=1}^{7} (w_i \times f_i)$$

| Factor | Weight ($w_i$) | Description |
|---|:---:|---|
| **Medical Facility Match** | **25%** | Matches injury/condition with hospital specialty level |
| **Bed Availability** | **20%** | Live emergency & ICU bed count |
| **Specialist Availability** | **15%** | On-duty trauma surgeon, cardiologist, or neurologist |
| **Equipment Availability** | **15%** | Operational CT scan, MRI, Cath lab, ventilators |
| **Blood Availability** | **10%** | Real-time units matching patient's blood group |
| **Travel Time** | **10%** | Real-time estimated transit duration |
| **Traffic Condition** | **5%** | Congestion index & green corridor availability |
| **Total** | **100%** | **Optimized Treatment-Ready Selection** |

### Verified Outcome (from Presentation Slide 7):
- **Hospital A:** $68\%$ (Distance: 3.2 km, but 0 ICU beds & specialist absent)
- **Hospital B:** $92\%$ ⭐ (Distance: 6.2 km, **Selected**: 6 ICU beds, Trauma surgeon on duty, CT scan operational, Blood matched)
- **Hospital C:** $75\%$ (Distance: 9.5 km, high travel latency)

---

## 🌐 How to Deploy to Render (Get Your Live Render Link)

You can host this project on **Render.com for 100% FREE** as a Static Web Service in under 2 minutes:

### Option A: 1-Click Render Blueprint (Recommended)
1. Initialize a git repository and push this directory to your **GitHub** account:
   ```bash
   git init
   git add .
   git commit -m "feat: initial commit of smart ambulance routing web app"
   git remote add origin https://github.com/<your-username>/smart-ambulance-routing.git
   git push -u origin main
   ```
2. Log in to [Render.com](https://render.com).
3. Click **New +** > **Blueprint**.
4. Connect your GitHub repository (`smart-ambulance-routing`).
5. Render will detect `render.yaml` automatically and configure:
   - **Type:** Static Site
   - **Publish Directory:** `.`
6. Click **Apply**.
7. Render will provide your public live URL:
   `https://smart-ambulance-routing-<unique-id>.onrender.com`

---

### Option B: Manual Deploy on Render Dashboard
1. Go to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** > **Static Site**.
3. Link your GitHub repository.
4. Fill in the fields:
   - **Name:** `smart-ambulance-routing`
   - **Branch:** `main` (or `master`)
   - **Build Command:** *(leave empty)*
   - **Publish Directory:** `.`
5. Click **Create Static Site**.
6. Your live site will be deployed instantly!

---

## 💻 Running Locally on Windows
Double-click `run-server.ps1` or run via PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File .\run-server.ps1
```
Open your browser at:
`http://localhost:8080`

---

## 📂 Project Structure
```
smart-ambulance-routing/
├── index.html        # Complete interactive emergency web dashboard & modules
├── style.css         # Custom animations, HUD styling & responsive rules
├── app.js            # AI Scoring engine, Leaflet mapping, audio synthesis, blood bank search
├── render.yaml       # Render.com Blueprint deployment configuration
├── package.json      # Node/NPM scripts specification
├── run-server.ps1    # Instant local HTTP server for Windows
└── README.md         # Documentation & deployment guide
```

---

## 🚨 Included Features
1. **Interactive OpenStreetMap with Leaflet.js:** Real-time animated ambulance trajectory, multi-hospital waypoints, dynamic traffic condition rendering.
2. **Hospital Pre-Alert Screen (HUD):** Slide 10 replica with live ETA countdown timer, priority badge, and synthesized audio radio chime.
3. **Regional Blood Bank Network:** Slide 8 search pipeline with group selection (A+, A-, B+, B-, O+, O-, AB+, AB-), stock alerts, and reservation dispatch.
4. **AI Weight Tuning Engine:** Real-time sliders allowing judges and users to test different weighting scenarios and observe live rank updates.
5. **Academic Slide Showcase:** Complete representation of all 15 presentation slides, problem statement, expected results, and future scope.
