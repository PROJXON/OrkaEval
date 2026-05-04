# OrkaEval
**Performance Review Platform — Momentum Internship Program**

OrkaEval is a structured performance evaluation system built for the Momentum Internship Program. It enables interns and their evaluators to complete multi-section performance reviews through a desktop application backed by a secure cloud API. The platform manages the full evaluation lifecycle — from self-assessment to joint review sessions — and syncs all data to a hosted backend.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Electron |
| **Backend** | ASP.NET Core 9, Entity Framework Core 9, AutoMapper |
| **Database** | SQLite (Development), PostgreSQL (Production) |
| **Auth** | Google OAuth 2.0 + JWT |
| **Testing** | xUnit, Moq, FluentAssertions (Backend) · Vitest, Testing Library (Frontend) |
| **CI/CD** | GitHub Actions |
| **Containerization** | Docker |

---

## Architecture

OrkaEval is organized into three main parts: a **React + Electron desktop frontend**, an **ASP.NET Core backend API**, and **Google Apps Script integrations**.

### Frontend

The frontend is a React 19 single-page application (SPA) wrapped in Electron to produce a cross-platform desktop app. It communicates with the backend via a REST API using Axios.

- **`src/pages/`** — Top-level route pages (Login, Dashboard, NotFound)
- **`src/components/forms/`** — Evaluation form sections (CheckIn, Coaching, Competencies, Reflection, JointSession, OpenDiscussion, SessionFacilitator, EvaluatorDashboard)
- **`src/components/ui/`** — Reusable UI primitives (e.g., Skeleton)
- **`src/context/`** — React Context for global user state (`UserContext`)
- **`src/utils/`** — Utility helpers for token storage and error handling
- **`src/api.js`** — Centralized Axios instance and API call definitions
- **`main.js`** — Electron main process entry point
- **`preload.js`** — Electron preload script

### Backend (OrkaEval.Api)

The backend is an ASP.NET Core Web API following the **Controller → Service → Repository** pattern, using EF Core as the ORM.

- **`Controllers/`** — Define REST API endpoints (`AuthController`, `EvaluationController`)
- **`Services/`** — Business logic layer (`EvaluationService`, `TokenService`, `EmailService`, `AuditService`)
- **`Models/`** — EF Core entity models and owned JSON types (`Evaluation`, `User`, `AuditLog`)
- **`Data/`** — `AppDbContext` — the EF Core session with the database
- **`Migrations/`** — EF Core schema migration history
- **`Profiles/`** — AutoMapper mapping profiles
- **`Program.cs`** — Application entry point; registers all services, middleware, auth, CORS, Swagger, and rate limiting

### Evaluation Data Model

Each `Evaluation` record is tied to a `User` and a `CycleId` and progresses through a status lifecycle:

```
Draft → SelfCompleted → EvaluatorCompleted → SessionCompleted
```

The evaluation stores six structured JSON sections directly on the record:

| Section | Description |
|---|---|
| `OpenDiscussion` | Role track, review period, icebreaker, top-of-mind notes |
| `CheckIn` | Mood, stress level, biggest win, wellbeing |
| `Coaching` | Pulse check, purpose & alignment, projects, professional development, personal growth, issue resolution |
| `Competencies` | 5 rated competencies (Technical Skills, Communication, Leadership, Growth & Learning, Culture) with self + evaluator ratings |
| `Reflection` | Achievements, challenges, goals, comments |
| `Session` | Joint session data — action plan, agreed goals, key takeaways, session rating |

### Google Apps Script

The `google-apps-script/` directory contains standalone Google Apps Script integrations for **Check-In** and **Coaching** form submissions, independent of the main Electron app.

---

## Project Structure

```
OrkaEval/
├── .github/
│   └── workflows/
│       └── ci.yml                  # CI pipeline (build, test)
├── backend/
│   └── OrkaEval.Api/
│       ├── Controllers/            # API endpoint definitions
│       ├── Data/                   # AppDbContext
│       ├── Migrations/             # EF Core migrations
│       ├── Models/                 # Entities & DTOs
│       ├── Profiles/               # AutoMapper profiles
│       ├── Services/               # Business logic
│       ├── Dockerfile              # Container definition
│       └── Program.cs              # App entry point & DI setup
├── frontend/
│   ├── public/                     # Static assets & roster CSV
│   ├── src/
│   │   ├── components/
│   │   │   ├── forms/              # Evaluation form sections
│   │   │   └── ui/                 # Shared UI components
│   │   ├── context/                # React Context (UserContext)
│   │   ├── pages/                  # Route-level pages
│   │   ├── utils/                  # Token store, error handler
│   │   ├── api.js                  # Axios API client
│   │   └── main.jsx                # React entry point
│   ├── main.js                     # Electron main process
│   ├── preload.js                  # Electron preload script
│   └── package.json
├── google-apps-script/
│   ├── check-in/                   # Google Apps Script for check-in form
│   └── coaching/                   # Google Apps Script for coaching form
├── OrkaEval.Tests/
│   └── Services/
│       └── EvaluationServiceTests.cs
└── OrkaEval.sln
```

---

## Prerequisites

| Tool | Version |
|---|---|
| .NET SDK | 9.0 |
| Node.js | 20+ |
| Git | Any recent version |
| Docker Desktop | (optional, for containerized backend) |

---

## Setup

### 1. Clone the Repository

```bash
git clone git@github.com:PROJXON/OrkaEval.git
cd OrkaEval
```

### 2. Restore Dependencies

```bash
# Backend
cd backend/OrkaEval.Api
dotnet restore

# Frontend
cd ../../frontend
npm install
```

### 3. Add Configuration Files

These files are **not** saved to source control. Obtain any missing credentials from an existing team member.

#### Backend — `backend/OrkaEval.Api/appsettings.Development.json`

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Information"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=orkaeval.db"
  },
  "Jwt": {
    "Key": "your-strong-secret-key-32-chars-minimum",
    "Issuer": "OrkaEval",
    "Audience": "OrkaEvalUsers",
    "ExpiryMinutes": "10080"
  },
  "Authentication": {
    "Google": {
      "ClientId": "your-google-client-id",
      "ClientSecret": "your-google-client-secret"
    }
  },
  "Frontend": {
    "Url": "http://localhost:5173"
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:5173", "http://localhost:5174"]
  },
  "Email": {
    "SmtpHost": "smtp.gmail.com",
    "SmtpPort": "587",
    "Username": "",
    "Password": "",
    "FromAddress": "noreply@orkaeval.com"
  }
}
```

#### Frontend — `frontend/.env`

```env
VITE_API_BASE_URL=http://localhost:5079/api
VITE_AUTH_BASE_URL=http://localhost:5079
```

Copy `frontend/.env.example` as a starting point:

```bash
cp frontend/.env.example frontend/.env
```

---

## Running the Project

### Backend

```bash
cd backend/OrkaEval.Api
dotnet run
```

The API will be available at `http://localhost:5079`. In development, Swagger UI is accessible at `http://localhost:5079/swagger`.

> The database is auto-created on first startup in development mode (SQLite file `orkaeval.db`).

### Frontend — Web (Browser)

```bash
cd frontend
npm run dev
```

The React app will be available at `http://localhost:5173`.

### Frontend — Desktop (Electron)

```bash
cd frontend
npm run electron:dev
```

This runs Vite and Electron concurrently. The desktop window will open automatically.

---

## Building for Production

### Backend (Docker)

```bash
docker build -t orkaeval-api ./backend/OrkaEval.Api
docker run -p 8080:8080 orkaeval-api
```

### Frontend — Web

```bash
cd frontend
npm run build
# Output: frontend/dist/
```

Deploy the `dist/` folder to a static host (e.g., Vercel, Netlify).

### Frontend — Desktop Executable

```bash
cd frontend
npm run build
npx electron-builder
# Output: frontend/dist-desktop/
```

This produces a portable Windows `.exe` in `frontend/dist-desktop/`.

---

## Testing

### Backend (xUnit)

```bash
dotnet test OrkaEval.Tests/OrkaEval.Tests.csproj
```

### Frontend (Vitest)

```bash
cd frontend
npm test
```

### Run All Tests

```bash
# From the repository root
dotnet test
cd frontend && npm test
```

---

## Environment Variables Reference

### Backend

| Key | Description |
|---|---|
| `ConnectionStrings__DefaultConnection` | DB connection string (SQLite in dev, PostgreSQL in prod) |
| `Jwt__Key` | JWT signing secret (32+ characters) |
| `Jwt__Issuer` | JWT issuer identifier |
| `Jwt__Audience` | JWT audience identifier |
| `Jwt__ExpiryMinutes` | Token lifetime in minutes |
| `Authentication__Google__ClientId` | Google OAuth client ID |
| `Authentication__Google__ClientSecret` | Google OAuth client secret |
| `Email__SmtpHost` | SMTP server hostname |
| `Email__Username` | SMTP username |
| `Email__Password` | SMTP password |

### Frontend

| Key | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend API base URL (e.g., `http://localhost:5079/api`) |
| `VITE_AUTH_BASE_URL` | Backend auth base URL (e.g., `http://localhost:5079`) |

---

## CI/CD

The repository includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that triggers on pushes and pull requests to `main`.

### CI Pipeline

```
Push / PR to main
    │
    ├── backend job
    │     ├── dotnet restore
    │     ├── dotnet build --no-restore -c Release
    │     └── dotnet test
    │
    └── frontend job
          ├── npm ci
          ├── npm run build
          └── npm test
```

---

## Common Tasks

| Task | Command |
|---|---|
| Add a NuGet package | `dotnet add package <package-name>` (run in `backend/OrkaEval.Api`) |
| Create an EF Core migration | `dotnet ef migrations add <MigrationName>` (run in `backend/OrkaEval.Api`) |
| Apply migrations to local DB | `dotnet ef database update` (run in `backend/OrkaEval.Api`) |
| Add a frontend npm package | `npm install <package-name>` (run in `frontend/`) |
| Lint frontend code | `npm run lint` (run in `frontend/`) |

---

## Troubleshooting

| Issue | Resolution |
|---|---|
| **Backend won't start — missing config** | Ensure `appsettings.Development.json` exists and contains all required keys |
| **Frontend can't reach the API** | Verify `VITE_API_BASE_URL` in `frontend/.env` matches the running backend port |
| **Google sign-in fails** | Check that `Authentication:Google:ClientId` and `ClientSecret` are correct and the OAuth redirect URI is configured in Google Cloud Console |
| **EF Core migration errors** | Run `dotnet ef database update` to ensure the schema is current |
| **Build errors** | Run `dotnet restore` and `dotnet clean` before rebuilding |
| **Electron window doesn't open** | Ensure `npm run dev` (Vite) is running before Electron launches; `electron:dev` handles this automatically |

For additional support, contact the senior application developer.

---

## Contributing

We use **feature branching**. Create a separate branch for each task, make your changes, and open a pull request (PR) to `main` when ready.

### Branch Naming Convention

```
<first-name-last-name>/<short-description>
```

**Example:** `jane-doe/add-coaching-section`

### Pull Request Process

1. **Verify Locally** — Confirm the app runs correctly in your feature branch
2. **Create a PR** to `main` with:
   - A clear summary of changes in bullet points
   - Notes on files added, modified, or removed
   - A reviewer assigned (typically the senior app developer)
3. **Address Feedback** — Make requested changes, push to your branch, and re-request review
4. **Merge** — Upon approval, the branch is merged and automatically deleted

### Code Quality Standards

- Follow C# coding conventions and .NET best practices
- Follow React best practices and component conventions
- Write unit tests for new backend service logic
- Ensure all tests pass before opening a PR
- Keep commits focused with clear, descriptive messages
- Update this README when adding new features or changing behavior
