# Unified Authority Communication System (UACS)

![UACS Portal](https://img.shields.io/badge/UACS-Secure_Communication-3b82f6?style=for-the-badge&logo=shield)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)

The **Unified Authority Communication System (UACS)** is a high-availability, multilingual, and role-based emergency communication portal designed for government and administrative use. It provides a secure mechanism for dispatching critical alerts, broadcasts, and notifications to targeted zones and subscribed users across multiple languages.

---

## 🌟 Key Features

### 1. Dual-Portal Architecture
- **Master Admin Portal**: Full control over composing broadcasts, managing recipients, and triggering emergency alerts. Requires elevated admin credentials.
- **User Alerts Portal**: A personalized dashboard for registered users to view active alerts, filter by zone, and configure their notification preferences.

### 2. Comprehensive Multilingual Localization
- The entire platform—including the login sequence, alerts feed, and user settings—is strictly localized into **5 core languages**:
  - 🇺🇸 English
  - 🇮🇳 Hindi (हिन्दी)
  - 🇮🇳 Marathi (मराठी)
  - 🇮🇳 Tamil (தமிழ்)
  - 🇮🇳 Telugu (తెలుగు)
- UI text transitions instantly via dynamic context providers.
- Broadcast messages are automatically translated into the user's preferred language upon delivery.

### 3. Targeted Zone Broadcasting
- Administrators can route alerts to specific geographic or administrative regions (e.g., North District, South District, Central Zone).
- Users are only notified of emergencies that directly impact their configured alert zone, reducing notification fatigue.

### 4. Emergency SMS Dispatch Integration
- Deep integration with **Twilio** for dispatching critical alerts directly via SMS.
- Users can add an **Emergency Contact Number** to ensure their trusted contacts automatically receive critical updates.
- Users have granular control to opt-in or opt-out of standard SMS notifications.

### 5. Advanced Security & Aesthetics
- **JWT Authentication**: Secure role-based access control.
- **Modern Glassmorphism UI**: High-end aesthetic using modern web design principles (translucency, smooth micro-animations, dynamic theme toggling).
- **Password Strength Enforcement**: Registration enforces strict 8+ character limits, uppercase, numeric, and special symbol criteria.

---

## 🛠 Tech Stack

**Frontend:**
- React 18 + Vite
- React Router DOM
- Tailwind CSS (Utility classes combined with vanilla CSS)
- Lucide React (Iconography)

**Backend:**
- Node.js & Express
- Supabase (PostgreSQL Database & Auth logic)
- Twilio API (SMS dispatch engine)
- Axios & CORS

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- A Supabase Project (URL & Anon Key)
- Twilio Account (Account SID, Auth Token, Phone Number)

### Environment Variables
Create a `.env` file in the `backend` directory:
```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Vaibhav-vx/UACS.git
   cd UACS
   ```

2. **Install Backend Dependencies & Start:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

3. **Install Frontend Dependencies & Start:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---

## 📖 Usage Guide

### Admin Access
- The system is designed to operate with a single Master Administrator.
- Default Admin Phone Number: `81698 25915` (Format automatically standardizes to `+918169825915`).
- The admin has exclusive access to the **Composer** and **Audit Logs**.

### User Registration & Demo
- Standard users can register via the main portal to access the User Dashboard.
- A **"Try Demo Profile"** button is provided on the Login screen for immediate, read-only access to the Public Alerts Feed without requiring phone verification.

### Managing Profile Preferences
1. Navigate to **My Profile** from the top-right menu.
2. Under **Alert Preferences**, customize your language and specific geographical zone.
3. Under **Emergency Contact**, specify a trusted relative or colleague who should receive critical SMS bypass alerts during an emergency.

---

## 📜 License
*Unified Authority Communication System - Secure Government Portal. For internal administrative deployment only.*
