# Unified Authority Communication System (UACS)

![UACS Header](https://img.shields.io/badge/UACS-Emergency_Command_Center-3b82f6?style=for-the-badge&logo=shield)
![Status](https://img.shields.io/badge/Status-Live_Production-22c55e?style=for-the-badge)
![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase_DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

The **Unified Authority Communication System (UACS)** is a state-of-the-art, mission-critical emergency communication platform designed to bridge the gap between administrative authorities and citizens during disasters. It provides a centralized "Command and Control" hub for multi-channel alert dispatching, real-time situation monitoring, and citizen safety coordination.

---

## 🚀 Vision: "Closing the Response Loop"
UACS is not just a messaging tool; it is a **complete lifecycle management platform**. It moves beyond broadcasting by tracking reach, collecting safety check-ins, coordinating rescue (SOS), and maintaining full accountability for every command decision.

---

## 🏛️ Administrative Command Suite (Portal 1)

### 📊 1. Central Nerve Center (Dashboard)
*   **Safety Analytics**: Real-time KPI tracking of "Safe" vs. "Need Help" reports.
*   **Performance Monitoring**: Tracking active vs. expired alerts and system-wide reach.
*   **Accountability Audit**: Displays the human reason provided for alert termination, closing the loop with citizens.

### 🚨 2. SOS Response Center (Crisis Queue)
*   **Priority Rescue Queue**: Sorts incoming distress signals by wait time and urgency.
*   **Assistance Tracking**: Admins can mark citizens as "Assisted," triggering an automatic "Help is coming" notification to the victim.
*   **Live Polling**: 10-second refreshes ensure authorities never miss a cry for help.

### ✍️ 3. Precision Composer & Intel Brief
*   **Multilingual Pipeline**: Instant translation into **Hindi, Marathi, Tamil, Telugu, and English**.
*   **Omni-Channel Dispatch**: Simultaneous broadcast to **SMS, Social Media (Twitter/X), Radio, and TV**.
*   **Pre-Dispatch Intel**: Mandatory check showing estimated reach and conflict detection (warning if alerts overlap in the same zone).

### ⚖️ 4. Approval Queue & Audit Log
*   **Dual-Step Verification**: Every message must be reviewed and approved before live dispatch.
*   **Traceability**: Full audit logs for every action taken, providing legal and operational accountability.

---

## 👥 Citizen Safety Portal (Portal 2)

### 🛡️ 1. Personal Emergency Command Center
*   **Dynamic Status Card**: Instant visual feedback: 🟢 "YOU ARE SAFE" or 🔴 "CRITICAL ALERT IN YOUR ZONE."
*   **Preparedness Score**: A gamified resilience gauge rewarding citizens for safety actions (Emergency Contact, Go-Bag verification, etc.).
*   **SOS Panic Button 2.0**: A hold-to-confirm emergency trigger with real-time GPS capture.

### 📖 2. National Survival Guide
*   **Disaster Handbook**: Comprehensive knowledge base for Earthquakes, Floods, Cyclones, and Fires.
*   **Survival Protocols**: Step-by-step instructions on what to do before, during, and after disasters.

### 📡 3. Interactive Situation Map
*   **GIS Integration**: Visualizes active alert zones and recipient density.
*   **EAP Navigation**: One-click Google Maps directions to the nearest **Emergency Assembly Points** and Shelters.

### 👥 4. Family & Community Network
*   **Safety Watch**: Monitor the safety status of family members registered in the same zone.
*   **Zone Transparency**: Public stats on zone-wide safety check-in rates.

---

## 🎮 Demo & Simulation
*   **Side-by-Side Simulation**: A dedicated tool that compares manual disaster response (slow, fragmented) with UACS automation (fast, unified). 
*   **Two-Way SMS Integration**: Judges can reply "SAFE" or "HELP" to an SMS alert and see the dashboard update in real-time.

---

## 🛠 Technical Architecture

### Frontend (Modern & Premium)
*   **React 18 + Vite**: Optimized performance and lightning-fast state management.
*   **Vanilla CSS Design System**: Custom **Glassmorphism** aesthetics for a premium, high-stakes look.
*   **React-Leaflet**: Integrated GIS mapping for situational awareness.

### Backend (Production-Ready)
*   **Node.js & Express**: High-concurrency API layer.
*   **Supabase (PostgreSQL)**: Scalable database with real-time listeners for live SOS updates.
*   **Twilio API**: Enterprise-grade SMS gateway with inbound webhook processing.
*   **JWT RBAC**: Strict Role-Based Access Control for all administrative functions.

---

## ⚙️ Quick Start

### 1. Environment
```env
SUPABASE_URL=...
SUPABASE_KEY=...
JWT_SECRET=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
```

### 2. Launch
```bash
npm install --prefix backend && npm run dev --prefix backend
npm install --prefix frontend && npm run dev --prefix frontend
```

---

## 📜 Professional Accountability
UACS is built on the philosophy that **transparency saves lives**. By unifying communication, automating translation, and providing real-time feedback, UACS ensures that in the face of disaster, no citizen is left behind.

*Unified Authority Communication System (UACS) - Secure Government Portal. Developed for internal administrative and emergency response deployment.*
