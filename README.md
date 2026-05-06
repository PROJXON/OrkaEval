# OrkaEval 🚀
**The Intelligent Performance OS & Lightweight HRIS**

OrkaEval is a premium, enterprise-grade **Human Resources Information System (HRIS)** and performance management platform designed for the Momentum Internship Program. It bridges the gap between daily tasks and long-term career growth through structured competency mapping and collaborative review cycles.

---

## ⚡ Team Quick Start (Desktop App)
If you are joining the team and want to run the **OrkaEval Desktop App** on your machine:

### 1. Clone & Install
```bash
git clone https://github.com/PROJXON/OrkaEval.git
cd OrkaEval/frontend
npm install
```

### 2. Configure
Create a file named `.env` inside the `frontend` folder:
```env
VITE_API_BASE_URL=https://orkaeval.onrender.com/api
VITE_AUTH_BASE_URL=https://orkaeval.onrender.com
```

### 3. Launch
```bash
npm run electron:dev
```

---

## 💎 Core HRIS & Talent Features

### 🎯 1. Competency Mapping
OrkaEval tracks growth across **5 Core Competency Areas**, allowing coaches to see real-time progress and skill gaps within their teams.

### 📊 2. Performance OS (Growth Cycles)
- **8-Week Sprints**: Performance is measured in standardized 56-day cycles.
- **Auto-Healing Timeline**: The system automatically generates new cycles for employees based on their start date.
- **Dual-Perspective Reviews**: Captures both Candidate reflection and Coach assessment for a 360° view.

### 🛡️ 3. Enterprise Security & Audit
- **Role-Based Access (RBAC)**: Distinct permissions for Candidates, Coaches, and Admins.
- **Secure Authentication**: Integrated with Google OAuth 2.0 and industry-standard JWT (JSON Web Tokens).
- **Persistent Audit Logs**: Every evaluation change is tracked to ensure data integrity.

### 🎨 4. Premium Interface
- **Desktop First**: A native experience with Electron, featuring deep-linking and tray integration.
- **Glassmorphism Design**: A state-of-the-art UI with high-contrast dark mode and smooth micro-animations.

---

## 🛠️ Technology Stack
| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19 + Vite | High-performance user interface |
| **Desktop** | Electron 41 | Cross-platform native application |
| **Backend** | .NET 9 Core | Scalable, enterprise API architecture |
| **Database** | PostgreSQL | Robust, relational data persistence |
| **Styling** | Vanilla CSS3 | Custom-tailored premium design system |

---

## 📦 Distribution & Deployment
### Generating a Standalone Installer (.exe)
To share a portable version of OrkaEval with your team:
1. `cd frontend`
2. `npm run build`
3. `npm run build:electron`
4. Find the installer in `frontend/dist-desktop/`.

### Cloud Infrastructure
- **API Hosting**: Render (Global Edge Network)
- **Frontend Hosting**: Vercel (Production Aliased)
- **Image CDN**: Cloudinary

---

## 🏗️ Architecture Deep Dive
OrkaEval uses a **Decoupled Architecture** with a strictly typed backend and a reactive frontend. The system is designed to handle thousands of concurrent evaluation records while maintaining sub-second response times.

---
© 2026 Projxon OrkaEval. All rights reserved. Built for professional talent management.
