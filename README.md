# Unified Authority Communication System (UACS)

![UACS Header](https://img.shields.io/badge/UACS-Emergency_Command_Center-3b82f6?style=for-the-badge&logo=shield)
![Status](https://img.shields.io/badge/Status-Live_Production-22c55e?style=for-the-badge)
![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase_DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

The **Unified Authority Communication System (UACS)** is a state-of-the-art, mission-critical emergency communication platform designed to bridge the gap between administrative authorities and citizens during disasters. It provides a centralized "Command and Control" hub for multi-channel alert dispatching, real-time situation monitoring, and citizen safety coordination.

---

## 🚀 Vision & Purpose
UACS is built to ensure that **no citizen is left behind** during a crisis. By unifying SMS, Social Media, Radio, and TV alerts into a single dashboard, authorities can broadcast life-saving information in seconds, across multiple languages, with guaranteed delivery tracking and real-time citizen feedback loops.

---

## 🌟 Core Features & Modules

### 1. Unified Dispatch Command Center (Admin)
*   **Omni-Channel Broadcast**: Send alerts simultaneously via **SMS (Twilio)**, **Twitter/X**, **Emergency Radio**, **TV Tickers**, and **Website Banners**.
*   **Multilingual Core**: Built-in support for **English, Hindi, Marathi, Tamil, and Telugu**. Automated translation pipeline ensures consistent messaging across diverse populations.
*   **Smart Composition**: Create alerts with master content and specialized instructions for different channels (e.g., short 160-char SMS vs. detailed web reports).

### 2. My Safety Dashboard (Citizen Portal)
*   **Personal Emergency Command Center**: A personalized landing page for every citizen showing their current safety status, active zone alerts, and nearby evacuation points.
*   **Live Weather Intelligence**: Real-time integration with weather APIs to provide seasonal context (e.g., Summer Heatwave warnings in Mumbai) and survival recommendations.
*   **One-Tap Safety Check-in**: During Critical alerts, users can mark themselves as "Safe" or "Need Help" with a single tap. This data is instantly beamed to the Admin Analytics dashboard for rescue prioritization.
*   **SOS Panic Button**: A dedicated emergency button that transmits a distress signal with precise coordinates to all nearby responders.

### 3. National Survival Guide & Knowledge Base
*   **Disaster-Specific Protocols**: A comprehensive handbook for **Earthquakes, Floods, Cyclones, Fires, and Heatwaves**.
*   **Interactive Learning**: Links to official **NDMA (National Disaster Management Authority)** training videos and downloadable emergency PDF guides.
*   **Survival Checklists**: Step-by-step instructions on what to do before, during, and after specific disaster scenarios.

### 4. Community Safety Network & Real-Time Stats
*   **Family Safety Network**: Citizens can monitor the safety status of their family and neighbors in the same zone.
*   **Transparency Analytics**: A public-facing stats page showing the number of registered citizens, safety check-in rates, and a 30-day alert history for the zone.
*   **Safety Score**: A dynamic "Community Safety Score" that measures a zone's resilience and responsiveness.

### 5. Interactive Situation Map & EAP Navigation
*   **Dynamic Heatmaps**: Admins visualize active alert zones and recipient density on a Leaflet-powered map.
*   **Direct Navigation**: Citizens can get one-click Google Maps directions to the nearest **Emergency Assembly Points (EAPs)**, shelters, and medical centers.
*   **Resizable Command View**: Admins can toggle between compact and full-screen map views for high-pressure situation monitoring.

---

## 🏗 Administrative Command Modules

The UACS Admin Portal is divided into specialized modules designed for high-stakes emergency management:

### 📊 Admin Dashboard (The Nerve Center)
*   **Functions**: Real-time KPI tracking, **Safety Analytics** (SOS/Safe reports), and the **Resizable Situation Map**.
*   **Purpose**: Provides an instantaneous "360-degree view" of the disaster's progress and the effectiveness of the communication response.

### ✍️ Message Composer (Precision Drafting)
*   **Functions**: Multi-channel drafting, automated translation, and urgency level assignment (Critical/High/Normal).
*   **Purpose**: Streamlines crafting accurate, localized information for diverse platforms in seconds.

### ⚖️ Approval Queue (The Final Safeguard)
*   **Functions**: Reviewing draft messages, final content verification, and manual "Dispatch" triggers.
*   **Purpose**: Prevents the accidental broadcast of incorrect or unauthorized information.

### 📜 Audit Log (Accountability & History)
*   **Functions**: Grouped lifecycle tracking of every message, including detailed timestamps and operator IDs.
*   **Purpose**: Essential for post-disaster analysis and legal accountability.

### 👥 Recipients & Zone Management
*   **Functions**: Managing the citizen database and assigning users to specific safety zones.
*   **Purpose**: Ensures emergency communications are **targeted**, reaching only those in danger.

### 🎮 Live Simulation (The "Why UACS" Tool)
*   **Functions**: Interactive side-by-side comparison of manual disaster response vs. automated UACS response.
*   **Purpose**: Visualizes the time saved and confusion reduced by using UACS automation.

---

## 🛠 Technical Architecture

### Frontend
*   **React 18 + Vite**: Lightning-fast performance and optimized builds.
*   **Tailwind CSS**: Utility-first styling with a custom **Premium Glassmorphism** design system.
*   **React-Leaflet**: Integrated GIS mapping for interactive situational awareness.
*   **Lucide Icons**: Professional, consistent iconography across all modules.

### Backend
*   **Node.js & Express**: High-performance API layer.
*   **Supabase (PostgreSQL)**: Secure, scalable database with real-time data synchronization.
*   **Twilio API**: Enterprise-grade SMS gateway for mass citizen outreach.
*   **JWT Authentication**: Secure session management for all user roles.

---

## ⚙️ Setup & Installation

### 1. Prerequisites
*   **Node.js** (v18.0+)
*   **Supabase Project** (Database & Auth)
*   **Twilio Account** (SID, Token, and Phone Number)

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_role_key
JWT_SECRET=your_secure_random_secret

# SMS Gateway (Twilio)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=your_number
```

### 3. Installation
```bash
# Install Backend Dependencies
cd backend && npm install

# Install Frontend Dependencies
cd ../frontend && npm install
```

### 4. Running the Project
```bash
# Start Backend (Port 5000)
cd backend && npm run dev

# Start Frontend (Vite)
cd ../frontend && npm run dev
```

---

## 🛡 Security & Compliance
*   **Role-Based Access Control (RBAC)**: Strict permissions for `admin` and `user` roles.
*   **Secure API Layers**: All management endpoints require valid JWT authentication.
*   **Data Integrity**: Every alert is digitally logged and auditable, ensuring total accountability.

---

## 📜 License & Ownership
*Unified Authority Communication System (UACS) - Secure Government Portal. Developed for internal administrative and emergency response deployment.*
