# OrkaEval

**Performance Review Platform — Momentum Internship Program**

OrkaEval is a structured performance evaluation system built for the Momentum Internship Program. It enables interns (Candidates) and their evaluators (Coaches) to complete multi-section performance reviews through a professional web and desktop interface. The platform manages the full evaluation lifecycle — from self-assessment to joint review sessions — and syncs all data to a secure cloud backend.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Electron, Tailwind CSS |
| **Backend** | ASP.NET Core 9, Entity Framework Core 9, AutoMapper |
| **Database** | PostgreSQL (Neon.tech - Production) · SQLite (Local Dev) |
| **Storage** | Cloudinary (Image Hosting) |
| **Auth** | Google OAuth 2.0 + JWT |
| **Deployment** | Vercel (Frontend) · Render (Backend) |

---

## Architecture

OrkaEval follows a modern decoupled architecture, separating the user interface from the business logic and data persistence.

### Frontend (React + Electron)
The frontend is a React 19 application built with Vite. It is designed to be dual-purpose: a high-performance web app and a cross-platform desktop app via Electron.

- **State Management**: Uses React Context (`UserContext`, `ThemeContext`) for global user identity and UI preferences.
- **Form Engine**: A modular form system handles complex evaluation sections (Check-In, Coaching, Competencies, etc.) with real-time validation.
- **Desktop Integration**: Electron handles deep-linking for Google OAuth callbacks and native window management.

### Backend (ASP.NET Core API)
The backend is a RESTful API following the **Controller-Service-Repository** pattern. It is containerized using Docker for consistent deployment across environments.

- **`Controllers/`**: Define REST API endpoints for authentication and evaluation management.
- **`Services/`**: Business logic layer (Token generation, Image processing, Audit logging).
- **`Data/`**: `AppDbContext` handles communication with PostgreSQL/SQLite.
- **`Models/`**: EF Core entities and DTOs (Data Transfer Objects) for safe data exposure.

### Evaluation Lifecycle
Each `Evaluation` record progresses through a status lifecycle:
`Draft` → `SelfCompleted` → `EvaluatorCompleted` → `SessionCompleted`

---

## Project Structure

```
OrkaEval/
├── backend/
│   └── OrkaEval.Api/
│       ├── Controllers/      # API Endpoints
│       ├── Data/             # DB Context & Initializers
│       ├── Models/           # Database Entities & DTOs
│       ├── Services/         # Business Logic (Auth, Images, Audit)
│       └── Dockerfile        # Container Configuration
├── frontend/
│   ├── src/
│   │   ├── components/       # UI Components & Form Sections
│   │   ├── context/          # React Context Providers
│   │   ├── pages/            # View-level components
│   │   └── api.js            # Axios configuration
│   ├── main.js               # Electron main process
│   └── package.json          # Frontend dependencies
├── docker-compose.yml        # Local container orchestration
└── OrkaEval.sln              # .NET Solution
```

---

## Prerequisites

- **.NET SDK 9.0**
- **Node.js 20+**
- **Docker Desktop** (optional, for local PostgreSQL testing)

---

## Setup & Local Development

### 1. Clone the Repo
```bash
git clone git@github.com:PROJXON/OrkaEval.git
cd OrkaEval
```

### 2. Backend Setup
1. Create `backend/OrkaEval.Api/appsettings.Development.json` (see template below).
2. Run the API:
```bash
cd backend/OrkaEval.Api
dotnet run
```
*The API will be available at http://localhost:5000 with Swagger at /swagger.*

### 3. Frontend Setup
1. Create `frontend/.env` (see template below).
2. Install and run:
```bash
cd frontend
npm install
npm run dev           # For Web
npm run electron:dev  # For Desktop
```

---

## Environment Configuration

### Backend (`appsettings.Development.json`)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=orkaeval.db"
  },
  "Jwt": {
    "Key": "YOUR_DEVELOPMENT_SECRET_KEY_MIN_32_CHARS",
    "Issuer": "OrkaEval",
    "Audience": "OrkaEvalUsers"
  },
  "Cloudinary": {
    "CloudName": "your_cloud_name",
    "ApiKey": "your_api_key",
    "ApiSecret": "your_api_secret"
  }
}
```

### Frontend (`.env`)
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_AUTH_BASE_URL=http://localhost:5000
```

---

## Deployment (Production)

The production environment is split across specialized providers for maximum reliability and $0 cost:

### 1. Frontend (Vercel)
- **Host**: `https://frontend-orkaeval.vercel.app`
- **Deployment**: Managed via Vercel CLI or GitHub integration.
- **Environment Variables**: `VITE_API_BASE_URL`, `VITE_AUTH_BASE_URL`.

### 2. Backend (Render)
- **Host**: `https://orkaeval-production.onrender.com`
- **Runtime**: Docker (using the project's `Dockerfile`).
- **Secrets**: Managed via Render Environment dashboard (ConnectionStrings, JWT Key, Cloudinary Keys).

### 3. Database (Neon.tech)
- **Type**: Managed PostgreSQL.
- **Scaling**: Serverless (scales to zero when not in use).

---

## Common Tasks

- **Creating a Migration**: `dotnet ef migrations add Name --project backend/OrkaEval.Api`
- **Updating Database**: `dotnet ef database update --project backend/OrkaEval.Api`
- **Building Electron**: `npm run build` then `npx electron-builder`

---

## Troubleshooting

- **CORS Errors**: Ensure the `Frontend__Url` environment variable on Render matches your Vercel URL.
- **Build Failures**: Check that `DataInitializer` is properly referenced in `Program.cs`.
- **Database Connection**: Verify the connection string in Render contains `sslmode=require` for Neon.

---

## Contributing

1. Create a feature branch: `firstname-lastname/feature-description`
2. Ensure local build succeeds: `dotnet build`
3. Submit a Pull Request to `main`.
