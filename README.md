# Unified Authority Communication System (UACS)

![UACS Header](https://img.shields.io/badge/UACS-Emergency_Command_Center-3b82f6?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Live_Production-22c55e?style=for-the-badge)
![Security](https://img.shields.io/badge/Security-JWT_RBAC-eb4034?style=for-the-badge)
![Architecture](https://img.shields.io/badge/Architecture-Dual_Portal_Loop-purple?style=for-the-badge)

The **Unified Authority Communication System (UACS)** is a mission-critical emergency communication platform designed to bridge the gap between administrative authorities and citizens during disasters. Developed as a **High-Stakes Command & Control Center**, UACS unifies multi-channel alert dispatching, real-time GIS situational awareness, and automated citizen safety coordination.

---

## 💡 The Innovation: "Closing the Rescue Loop"
Most disaster systems are one-way (Broadcasting). **UACS is a two-way loop.**
1. **Admin Dispatches**: One message, 5 languages, 5 channels instantly.
2. **Citizen Responds**: Safety check-in (Safe/Help) with live GPS.
3. **Authority Acts**: SOS Response Center alerts rescue teams and **notifies the citizen** that help is on the way.
4. **Accountability**: Every expired alert requires a "Reason for Closure" which is displayed back to the citizen, building total transparency.

---

## 🏛️ Administrative Command Suite (Portal 1)

### 📊 1. GIS-Nerve Center (Live Dashboard)
*   **Dynamic Map Analytics**: Integrated Leaflet map showing active alert polygons and recipient density.
*   **Real-time KPI Tracking**: Live counters for "Safe Today" vs. "Pending Rescue" derived directly from Supabase.
*   **Rapid Pin Alert**: Admin can click anywhere on the map to instantly broadcast a localized alert.

### 🚨 2. SOS Response Center (Rescue Queue)
*   **Triage System**: incoming distress signals sorted by wait time and precision.
*   **Feedback Loop**: When an admin marks an SOS as "Assisted," UACS automatically triggers a Twilio SMS to the victim: *"Help is coming. Stay where you are."*

### ✍️ 3. Precision Composer & Multilingual Engine
*   **Instant Translation**: Auto-translates master content into **Hindi, Marathi, Tamil, Telugu, and English**.
*   **Channel Orchestration**: Simultaneous broadcast to **SMS, Social Media (Twitter/X), Radio, TV, and Web**.
*   **Pre-Dispatch Intel**: Mandatory reach estimates and conflict detection to prevent alert fatigue.

---

## 👥 Citizen Safety Portal (Portal 2)

### 🛡️ 1. Emergency Command Center
*   **OLED Black Aesthetic**: Designed for low-power high-contrast visibility during power outages.
*   **SOS Panic Button 2.0**: Advanced "Hold to Confirm" logic to prevent accidental triggers while capturing live GPS.

### 📖 2. National Survival Guide
*   **Interactive Handbooks**: Step-by-step protocols for Earthquakes, Floods, Cyclones, and Fires.
*   **Offline-Ready UX**: Critical survival instructions are accessible even in low-bandwidth scenarios.

### 📡 3. EAP Navigation
*   **Nearest Shelter Finder**: One-click routing to **Emergency Assembly Points** (EAPs) with capacity tracking.

---

## 🛠 Technical Architecture & Innovation

### The "Innovation Stack"
| Feature | Implementation | Innovation |
| :--- | :--- | :--- |
| **Multilingual Expiry** | Node.js + i18next | Expiry reasons are shown in the citizen's preferred language, a global first. |
| **GIS-Linked SOS** | Leaflet + PostGIS | Distress signals include precision coordinates for ground rescue teams. |
| **Inbound SMS Hook** | Twilio Webhooks | Citizens can reply "SAFE" via basic feature phone, and the Admin DB updates live. |
| **Cinema Simulation** | GSAP + React | A judge-facing simulation that visualizes the "Golden Hour" of disaster response. |

### Technical Stack
*   **Frontend**: React 18, Vite, Lucide Icons, Leaflet.js.
*   **Design**: Solid Black OLED Theme, Glassmorphism, Micro-animations.
*   **Backend**: Node.js, Express, JWT, Bcrypt.
*   **Database**: Supabase (PostgreSQL) with Real-time Realtime.
*   **Integrations**: Twilio (SMS), Google Translate (NLP).

---

## ⚙️ Quick Start

### 1. Environment Configuration
Create a `.env` in the root (or `backend/`):
```env
SUPABASE_URL=...
SUPABASE_KEY=...
JWT_SECRET=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
```

### 2. Launch Commands
```bash
# Backend
npm install --prefix backend && npm run dev --prefix backend

# Frontend
npm install --prefix frontend && npm run dev --prefix frontend
```

---

## 📜 Vision for the Future
UACS is built on the philosophy that **information is a survival tool**. By unifying communication and ensuring a closed-loop feedback system, we turn chaos into coordinated action.

*Unified Authority Communication System (UACS) - Secure Government Portal. Developed for hackathon demonstration and critical deployment.*
