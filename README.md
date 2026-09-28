# ResumeMate AI

ResumeMate is a resume builder, ATS reviewer, and job-description matcher. Resume checks and writing suggestions use built-in rules and keyword lists. The application does not need Ollama, a model download, a Cloudflare Tunnel, or an external AI provider.

## Features

- Create, edit, preview, and download resumes.
- Import text-based PDF and DOCX resumes into the editor.
- Review contact details, sections, skills, action verbs, and measurable outcomes.
- Compare a resume with recognized skills and keywords in a job description.
- Receive writing templates and fact-preserving suggestions; the app does not invent metrics or qualifications.
- Save resumes, ATS reports, and job-match history to the configured backend database.

## Technology

| Area | Stack |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Python, FastAPI, Pydantic, SQLAlchemy |
| Database | SQLite by default; PostgreSQL can be configured with `DATABASE_URL` |
| Documents | pypdf, python-docx, ReportLab |
| Resume analysis | Built-in deterministic rules and recognized skill keywords |

## Requirements

- Python 3.11 or later
- Node.js 20 or later and npm

## Run locally on Windows

Open two PowerShell terminals from the project directory.

### 1. Start the backend

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The health endpoint is [http://localhost:8000/api/health](http://localhost:8000/api/health); API documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 2. Start the frontend

```powershell
cd frontend
npm ci
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite forwards `/api` requests to the backend on port 8000.

### macOS or Linux

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

In another terminal:

```bash
cd frontend
npm ci
npm run dev
```

## Resume analysis behavior

The analyzer uses explicit checks and recognized keywords, so it works the same way for every device without model installation or third-party model calls. ATS scores are guidance estimates, not hiring predictions. Job matching reports recognized keyword overlap; it does not claim semantic understanding. Suggested skills are examples to verify, and generated bullet templates use placeholders instead of fabricated accomplishments.

Resume files and account data are sent to the backend configured for the app and stored according to that deployment's database and file-storage settings. The analyzer itself does not send resume content to an external AI provider.

## Deploy with Vercel and Render

The repository includes `frontend/vercel.json` for client-side routes and `render.yaml` for the FastAPI backend.

### Frontend

Set the Vercel root directory to `frontend`, with build command `npm run build` and output directory `dist`. Configure this build-time variable to the deployed Render API:

```text
VITE_API_BASE_URL=https://<your-render-service>.onrender.com/api
```

Redeploy Vercel after changing the value.

### Backend

Create the Render service from `render.yaml`. Set `DATABASE_URL` and `CORS_ORIGINS` when prompted. `CORS_ORIGINS` must include the exact Vercel site origin, for example `https://your-project.vercel.app`. Set a private `SECRET_KEY`; the blueprint can generate one. No Ollama, model, Cloudflare, or AI-provider environment variables are needed.

Check the deployed service at `https://<your-render-service>.onrender.com/api/health`. The built-in analysis status is at `/api/ai/status` and returns `available: true` when the backend is responding.

Render's free service may sleep when idle. Its next request can take time to wake it; this is backend hosting behavior and is separate from resume analysis, which does not require a model service.

## Configuration

`backend/.env.example` lists the local settings. Configure `SECRET_KEY`, `DATABASE_URL`, `CORS_ORIGINS`, and `MAX_UPLOAD_SIZE_MB` as needed. Do not commit `.env`, database files, or uploaded resumes.

## Main routes

- `/dashboard` — resume and analysis overview
- `/builder` — create or edit a resume
- `/edit-resume` — import and manage a resume
- `/analyzer` — ATS review
- `/job-matcher` — compare a resume with a job description
- `/history` — saved analysis history
- `/templates` — resume templates
- `/profile` — account and password settings

All backend API routes are prefixed with `/api`. See `/docs` on a running backend for the available endpoints.
