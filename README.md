# Unified Authority Communication System (UACS)

![UACS Portal](https://img.shields.io/badge/UACS-Secure_Communication-3b82f6?style=for-the-badge&logo=shield)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

The **Unified Authority Communication System (UACS)** is a high-availability, mission-critical emergency communication platform. It bridges the gap between administrative authorities and citizens during disasters, providing real-time alerts, safety check-ins, and interactive situational awareness.

---

## 🌟 Key Features

### 1. Dual-Portal Personalized Experience
- **Admin Command Center**: Complete oversight of the communication pipeline. Tools for composing multi-channel broadcasts, managing recipients via map-based zone picking, and monitoring real-time safety response analytics.
- **Citizen Safety Portal**: A personalized dashboard for users featuring:
  - **Dynamic Greetings**: Localized welcomes in 5 languages.
  - **Zone-Filtered Alerts**: Citizens only see alerts relevant to their configured safety zone.
  - **Safety Check-in System**: Interactive banners during critical emergencies asking "Are you safe?" with one-tap status reporting.

### 2. Interactive Situation Map
- **Live Alert Visualization**: Real-time rendering of active emergency zones with urgency-based color coding.
- **Evacuation Points (EAPs)**: Dynamic markers for assembly points and shelters with instant routing directions.
- **Admin Heatmap**: Administrators can visualize recipient density by zone to prioritize rescue efforts.

### 3. Integrated Safety Check-in Logic
- During **CRITICAL** alerts, users receive a prominent safety banner.
- Tapping **"YES, I AM SAFE"** or **"SOS: ASSISTANCE REQUIRED"** instantly updates the central Admin Analytics dashboard.
- Admin dashboard provides real-time counts and names of citizens requiring urgent help.

### 4. Emergency Contact Auto-Notification
- **High-Priority Registration**: Users can register a trusted emergency contact (e.g., Mom, Spouse).
- **Automated Bypass**: Whenever a CRITICAL alert is issued in a user's zone, the system automatically dispatches a parallel SMS to their emergency contact, ensuring family awareness without user intervention.

### 5. Multi-Channel & Multilingual Dispatch
- **5 Core Languages**: English, Hindi, Marathi, Tamil, and Telugu.
- **Omni-Channel**: SMS (Twilio), Twitter/X, Radio Scripts, TV Tickers, and Website Banners.
- **Phone Normalization**: Intelligent +91 formatting ensures delivery success across all Indian carriers.

---

## 🛠 Tech Stack

**Frontend:**
- React 18 + Vite
- **React-Leaflet / Leaflet.js** (Mapping & GIS)
- Lucide React (Iconography)
- Glassmorphism Design System (Custom CSS)

**Backend:**
- Node.js & Express
- Supabase (PostgreSQL + Realtime)
- Twilio API (SMS Gateway)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase Account
- Twilio Account

### Environment Variables
Create a `.env` file in `/backend`:
```env
PORT=5000
SUPABASE_URL=...
SUPABASE_KEY=...
JWT_SECRET=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
```

### Installation & Run

1. **Backend**:
   ```bash
   cd backend && npm install && npm run dev
   ```

2. **Frontend**:
   ```bash
   cd frontend && npm install && npm run dev
   ```

---

## 📖 Usage Guide

### Demo Access
The system includes a high-fidelity **Demo Portal**. Click **"Try Demo Profile"** on the login page to enter as a standard user with pre-configured preferences (Zone 4, Hindi) to experience the personalized safety features instantly.

### Admin Credentials
- **Access**: Restricted to authorized government personnel.
- **Features**: Approval Queue, Audit Logs, Recipient Map Management, and Safety Analytics.

### Registration
Standard registration is open to all citizens. Upon registering, users should immediately:
1. Set their **Safety Zone**.
2. Add an **Emergency Contact Name & Mobile**.
3. Toggle **SMS Notifications** to "On".

---

## 📜 License
*Unified Authority Communication System - Secure Government Portal. For internal administrative deployment only.*
