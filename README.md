# OrkaEval 🚀
**The Performance Review OS — Momentum Internship Program**

OrkaEval is a premium performance evaluation system. This repository contains both the web platform and the **Desktop Application**.

---

## ⚡ Team Quick Start (Desktop App)
If you are joining the team and want to run the **OrkaEval Desktop App** on your machine, follow these 3 steps:

### 1. Clone & Install
```bash
git clone https://github.com/PROJXON/OrkaEval.git
cd OrkaEval/frontend
npm install
```

### 2. Configure (One-time)
Create a file named `.env` inside the `frontend` folder:
```env
VITE_API_BASE_URL=PASTE_YOUR_BACKEND_API_URL_HERE
VITE_AUTH_BASE_URL=PASTE_YOUR_BACKEND_AUTH_URL_HERE
```

### 3. Launch Desktop App
```bash
npm run electron:dev
```
*Note: You do **not** need to run the backend locally. The app is pre-configured to talk to the live production server!*

---

## 📦 How to Build an Installer (.exe)
If you want to create a standalone installer to share with others:
1. Go to `frontend` folder.
2. Run `npm run build`.
3. Run `npm run build:electron`.
4. Your installer will be in `frontend/dist_electron/`.

---

## 🛠️ Tech Stack
| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Electron |
| **Backend** | ASP.NET Core 9, Entity Framework Core 9 |
| **Database** | PostgreSQL (Production) · SQLite (Local) |
| **Branding** | Custom OrkaEval Design System |

---

## 🛡️ Key Features
- **Dual Mode**: Runs in Chrome/Edge or as a standalone Windows/Mac/Linux app.
- **Deep Linking**: Seamless Google Login integration even on desktop.
- **Auto-Sync**: Desktop app automatically stays in sync with the cloud database.
- **Premium UI**: Dark mode support, glassmorphism, and smooth layout transitions.

---

## 🏗️ Project Structure
- `backend/`: .NET Core API and Database logic.
- `frontend/`: React source code and Electron configuration.
- `frontend/main.js`: The desktop app launcher.

---

## 🤝 Contributing
1. Create a feature branch: `git checkout -b your-name/feature`
2. Make your changes and commit: `git commit -m "feat: amazing update"`
3. Push and open a Pull Request!

---
© 2026 Projxon OrkaEval. All rights reserved.
