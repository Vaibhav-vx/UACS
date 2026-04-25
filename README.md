# Unified Authority Communication System (UACS)

![UACS Header](https://img.shields.io/badge/UACS-Emergency_Command_Center-3b82f6?style=for-the-badge&logo=shield)
![Status](https://img.shields.io/badge/Status-Live_Production-22c55e?style=for-the-badge)
![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase_DB-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

The **Unified Authority Communication System (UACS)** is a state-of-the-art, mission-critical emergency communication platform designed to bridge the gap between administrative authorities and citizens during disasters. It provides a centralized "Command and Control" hub for multi-channel alert dispatching, real-time situation monitoring, and citizen safety coordination.

---

## 🚀 Vision & Purpose
UACS is built to ensure that **no citizen is left behind** during a crisis. By unifying SMS, Social Media, Radio, and TV alerts into a single dashboard, authorities can broadcast life-saving information in seconds, across multiple languages, with guaranteed delivery tracking.

---

## 🌟 Core Features & Modules

### 1. Unified Dispatch Command Center
*   **Omni-Channel Broadcast**: Send alerts simultaneously via **SMS (Twilio)**, **Twitter/X**, **Emergency Radio**, **TV Tickers**, and **Website Banners**.
*   **Multilingual Core**: Built-in support for **English, Hindi, Marathi, Tamil, and Telugu**. Automated translation pipeline ensures consistent messaging.
*   **Smart Composition**: Create alerts with master content and specialized instructions for different channels (e.g., short 160-char SMS vs. detailed web reports).

### 2. Interactive Situation & Heatmap (Admin)
*   **Resizable Map Card**: A dynamic dashboard map with **Small, Medium, and Large** toggles, allowing admins to switch between a compact overview and a detailed "ClearView" for monitoring.
*   **Zone-Based Visualization**: Active alerts are rendered as pulse zones on a Leaflet-powered map.
*   **Recipient Heatmap**: Admins can see the density of citizens in various zones to prioritize rescue operations.
*   **Assembly Points (EAP)**: Visual markers for Medical Centers, Shelters, and Assembly points with capacity tracking.

### 3. Citizen Safety Portal
*   **Zone-Filtered Alerts**: Citizens receive only the alerts that affect their specific safety zone, reducing "alert fatigue."
*   **One-Tap Safety Check-in**: During Critical alerts, users see a prominent banner asking "Are you safe?". Responses (Safe / Need Assistance) are instantly beamed to the Admin Analytics dashboard.
*   **Emergency Contact Sync**: Users can register an emergency contact who is **automatically notified** via SMS whenever a critical alert is issued in the user's zone.

### 4. Robust SMS Gateway
*   **Batch Processing**: Optimized for mass delivery. The system automatically batches SMS alerts (10 at a time) with staggered delays to prevent Twilio rate-limiting.
*   **Marathi Character Support**: Full support for Unicode characters to ensure Marathi and other regional alerts are readable on all devices.
*   **Number Normalization**: Intelligent +91 formatting handles various user input styles automatically.

### 5. Advanced Audit & Lifecycle Tracking
*   **Grouped Audit Logs**: A clean, chronological view of alert lifecycles. Instead of thousands of lines, entries are grouped by "Message ID."
*   **Expandable History**: Click any alert log to see its entire lifecycle: *Created -> Edited -> Approved -> Dispatched*.
*   **Full Accountability**: Every action is logged with the timestamp, channel, and the administrator who performed it.

### 6. Recipient & User Synchronization
*   **Unified Management**: Adding a recipient to the system automatically creates a Citizen Portal account for them.
*   **Credential Auto-Gen**: Portals are secured using the recipient's mobile number as the username and a standardized `name-sx` password format for easy onboarding.

---

## 🏗 Administrative Command Modules

The UACS Admin Portal is divided into specialized modules, each designed for high-pressure emergency management:

### 📊 Admin Dashboard (The Nerve Center)
*   **Functions**: Real-time KPI tracking (Active vs Expired alerts), **Safety Analytics** (Aggregated SOS/Safe reports), and the **Resizable Situation Map**.
*   **Purpose**: Provides an instantaneous "360-degree view" of both the disaster's progress and the effectiveness of the communication response.

### ✍️ Message Composer (Precision Drafting)
*   **Functions**: Multi-channel drafting, automated translation into 5 regional languages, and urgency level assignment (Critical/High/Normal).
*   **Purpose**: Streamlines the complex task of crafting accurate, localized information for diverse platforms (SMS, Twitter, Web) in seconds.

### ⚖️ Approval Queue (The Final Safeguard)
*   **Functions**: Reviewing draft messages, final content verification, and manual "Dispatch" triggers for SMS and social channels.
*   **Purpose**: Prevents the accidental broadcast of incorrect or unauthorized information, ensuring all public alerts are verified by a second authority.

### 📜 Audit Log (Accountability & History)
*   **Functions**: Grouped lifecycle tracking of every message ever sent, from initial draft to final expiration. Includes detailed timestamps and operator IDs.
*   **Purpose**: Essential for post-disaster analysis, legal accountability, and debugging delivery performance across different channels.

### 👥 Recipients & Zone Management (Targeted Outreach)
*   **Functions**: Managing the citizen database, assigning users to specific safety zones using an interactive map picker, and syncing portal credentials.
*   **Purpose**: Ensures that emergency communications are **targeted**, reaching only the people in danger zones to prevent panic in unaffected areas.

### 📋 Templates Library (Speed-of-Response)
*   **Functions**: Management of pre-configured alert messages for common disasters (Floods, Earthquakes, Industrial Leaks).
*   **Purpose**: Saves life-critical minutes during the onset of a disaster by allowing admins to launch verified alerts from proven presets.

---

## 🛠 Technical Architecture

### Frontend (Modern Stack)
*   **React 18 + Vite**: Lightning-fast development and optimized production builds.
*   **Tailwind CSS v4**: Utility-first styling with a custom Glassmorphism design system.
*   **React-Leaflet**: Integrated GIS mapping for interactive situational awareness.
*   **Lucide Icons**: Professional, consistent iconography across all modules.

### Backend (Secure & Scalable)
*   **Node.js & Express**: High-performance API layer.
*   **Supabase (PostgreSQL)**: Secure, scalable database with real-time capabilities.
*   **Twilio API**: Enterprise-grade SMS gateway integration.
*   **JWT Authentication**: Secure session management for Admins and Citizens.

---

## 📂 Project Structure

```text
UACS/
├── frontend/             # React (Vite) Application
│   ├── src/
│   │   ├── api/          # Axios API service layer
│   │   ├── components/   # Reusable UI (MapCard, ExpiryTimer, etc.)
│   │   ├── i18n/         # Language context and translations
│   │   └── pages/        # Main route views (Dashboard, Audit, Map)
├── backend/              # Node.js Express Server
│   ├── routes/           # API Endpoints (Auth, Messages, Audit, Recipients)
│   ├── integrations/     # Third-party (SMS Gateway, Social APIs)
│   └── database/         # Supabase connection & schema
└── .env                  # Environment configurations
```

---

## ⚙️ Setup & Installation

### 1. Prerequisites
*   **Node.js** (v18.0 or higher)
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
*   **Role-Based Access Control (RBAC)**: Distinct permissions for `admin` and `user` roles.
*   **Secure API Layers**: All management endpoints require valid JWT tokens.
*   **Encrypted Storage**: Sensitive data and preferences are handled via secure Supabase policies.

---

## 📜 License & Ownership
*Unified Authority Communication System (UACS) - Secure Government Portal. Developed for internal administrative and emergency response deployment.*
