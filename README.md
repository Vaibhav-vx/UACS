# 🛡️ UACS — Unified Authority Communication System

**UACS** is a mission-critical centralized communication platform designed for government and civic authorities. It enables officials to compose a single master message that is automatically translated into multiple regional languages and dispatched across a unified channel network (SMS, Twitter, Radio, TV, Website) with built-in approval workflows and lifecycle management.

[![UACS Security](https://img.shields.io/badge/Security-Government_Grade-blue?style=for-the-badge&logo=shield)](https://github.com/Vaibhav-vx/UACS)
[![UACS Translation](https://img.shields.io/badge/Translation-Google_Translate-green?style=for-the-badge&logo=google-translate)](https://github.com/Vaibhav-vx/UACS)
[![UACS DB](https://img.shields.io/badge/Database-Supabase_PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://github.com/Vaibhav-vx/UACS)

---

## ✨ Features

- **🎯 Unified Dispatch**: One-click broadcast to SMS (via Twilio), Social Media (Twitter), and legacy channels (Radio/TV).
- **🌍 Real-time Translation**: Integrated with **Google Translate API** for reliable translations into Hindi, Tamil, Urdu, Bengali, and Telugu.
- **🛡️ Secure Approval Workflow**: 
  - **Draft**: Initial composition stage.
  - **Review**: Approvers verify translations and consistency.
  - **Reject**: Feedback loop to send messages back to Draft for revisions.
  - **Approve & Dispatch**: Final authorization for live broadcast.
- **⏲️ Lifecycle Management**: Live countdown timers for each alert with automated expiry actions (manual extend/expire supported).
- **🚨 Emergency Broadcast**: Floating emergency trigger for critical situations requiring instant, all-channel, all-language dispatch.
- **👤 User Profile & Security**: Managed administrative profiles with department tracking and secure password management.
- **📋 Audit & Compliance**: Full historical log of every status change, rejection, and dispatch action, exportable as CSV.

---

## 🏗️ Technical Architecture

### Tech Stack
- **Frontend**: React 18, Vite, Lucide Icons, Tailwind CSS v4.
- **Backend**: Node.js, Express.js.
- **Database**: **Supabase (PostgreSQL)** for cloud-native, scalable storage.
- **Integrations**:
  - **SMS**: Twilio Messaging Service (Supports Geo-permissions).
  - **Translation**: Google Translate API + MyMemory Fallback.
  - **Authentication**: JWT-based secure sessions with Argon2/Bcrypt hashing.

---

## 📁 System Structure

```
UACS/
├── frontend/             # React Application
│   ├── src/
│   │   ├── pages/        # Dashboard, Composer, Approval, Profile, Audit
│   │   ├── components/   # ExpiryTimer, LanguageCard, ChannelBadge
│   │   ├── i18n/         # Multi-language context & translations
│   │   └── api.js        # Centralized Axios API service layer
│
├── backend/              # Node.js Server
│   ├── routes/           # Auth, Messages, Dispatch, Translate, Audit
│   ├── database/         # Supabase connection & helpers
│   ├── integrations/     # Twilio & Google Translate wrappers
│   └── cron/             # Automated expiry jobs (60s cycle)
│
└── .env                  # Configuration (Excl. from Git)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Supabase Project & URL
- Twilio Account (Account SID, Auth Token, Messaging Service SID)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Vaibhav-vx/UACS.git
   cd UACS
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Variables**
   Create a `.env` in the root:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_KEY=your_supabase_key
   TWILIO_ACCOUNT_SID=your_sid
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_Messaging_Service_SID=your_msg_svc_sid
   JWT_SECRET=your_random_secret
   ```

5. **Run Development**
   ```bash
   # In backend/
   npm run dev
   
   # In frontend/
   npm run dev
   ```

---

## 🛡️ Audit & Security
UACS implements a strict **Audit Consistency Score** for all translations, ensuring that regional messages maintain the original intent and urgency of the master English message. The system also supports **Bulk Cleanup** of audit logs to maintain performance.

---

*Built for secure government civic communications • UACS v1.2*
