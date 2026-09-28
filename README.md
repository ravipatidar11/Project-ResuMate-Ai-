# ResumeMate AI

ResumeMate AI is a full-stack resume builder and job-search toolkit. It combines a React interface with a FastAPI backend, local SQLite storage, PDF/DOCX parsing, ATS analysis, job-description matching, and optional local AI powered by Ollama.

## What it includes

- **Resume Builder:** create and edit structured resumes, autosave changes, choose a professional template, preview the result, and download a PDF.
- **Edit Resume:** import a text-based PDF or DOCX, extract its content into editable sections, keep the uploaded source file unchanged, and create separate saved versions.
- **Resume history:** reopen versions and download the original uploaded file.
- **AI writing help:** request suggestions for summaries, experience bullets, project bullets, skills, and ATS readiness. Suggestions are reviewed before they are applied.
- **ATS Analyzer:** review resume structure, keywords, skills, and recommendations; analyses are saved to history.
- **Job Matcher:** compare a resume with a job description, review skill overlap and gaps, and tailor resume content.
- **Local AI:** AI requests use an Ollama model running on your computer. Resume data is not sent to a hosted AI API by this application.

### Imported resume formatting

PDF and DOCX uploads are parsed into ResumeMate's structured editor. The original upload remains available unchanged, while the editable preview and downloaded edited PDF use the selected ResumeMate template. The source document's exact visual styling is not currently reproduced in the editable output.

## Technology

| Area | Stack |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS, React Router |
| Backend | Python, FastAPI, Pydantic, SQLAlchemy |
| Database | SQLite by default; PostgreSQL can be configured with `DATABASE_URL` |
| Documents | pypdf, python-docx, ReportLab |
| AI | Ollama local model (default: `llama3.2`) |

## Requirements

- Python 3.11 or later
- Node.js 20 or later and npm
- Ollama for AI-powered features

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

The backend creates the SQLite database and upload directory on startup. API documentation is available at [http://localhost:8000/docs](http://localhost:8000/docs), and the health endpoint is [http://localhost:8000/api/health](http://localhost:8000/api/health).

### 2. Start the frontend

```powershell
cd frontend
npm ci
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api` requests to the backend on port 8000.

### macOS or Linux

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
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

## Set up local AI (Ollama)

Install and start [Ollama](https://ollama.com/), then download the default model:

```bash
ollama pull llama3.2
```

The default backend settings expect Ollama at `http://localhost:11434`. The model and URL can be changed in `backend/.env` using `OLLAMA_MODEL` and `OLLAMA_BASE_URL`. Check **AI status** in the application if requests are unavailable. Resume editing, file extraction, templates, and PDF generation do not require Ollama.

## Configuration

`backend/.env.example` lists the available local settings. Copy it to `backend/.env` and set a unique `SECRET_KEY` before using the application beyond local development.

| Variable | Default | Purpose |
| --- | --- | --- |
| `SECRET_KEY` | Development value in app settings | JWT signing key; replace with a private random value |
| `DATABASE_URL` | `sqlite:///./sql_app.db` | SQLAlchemy database URL |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Ollama server address |
| `OLLAMA_MODEL` | `llama3.2` | Installed Ollama model name |
| `MAX_UPLOAD_SIZE_MB` | `10` | Maximum accepted resume upload size |

Do not commit `.env`, database files, or uploaded resumes. They are excluded by `.gitignore`.

## Deploy with Neon, Render, and Vercel

The repository includes a Render Blueprint at `render.yaml` and Vercel SPA routing at `frontend/vercel.json`.

### 1. Create the Neon database

1. Create a PostgreSQL project in Neon.
2. In the connection details, copy the **pooled** connection string and keep it private. Neon connection strings use the standard PostgreSQL URI format; the application accepts `postgresql://` and `postgres://` URLs and selects the psycopg 3 driver automatically. Keep Neon's TLS query options (such as `sslmode=require`) in the URL.

### 2. Deploy the frontend to Vercel

1. Import `ravipatidar11/Project-ResuMate-Ai-` into Vercel.
2. Set **Root Directory** to `frontend` and use the Vite defaults: build command `npm run build`, output directory `dist`.
3. Deploy once and note the production domain Vercel assigns to the project.

`frontend/vercel.json` rewrites app routes to `index.html`, so direct links such as `/builder/14` load correctly. Vite needs the Render API URL at build time; add this environment variable in Vercel under Production (and Preview if needed):

```text
VITE_API_BASE_URL=https://<your-render-service>.onrender.com/api
```

Redeploy after adding or changing this variable; Vite embeds `VITE_` variables into the browser build.

### 3. Deploy the backend to Render

1. In Render, create a **Blueprint** from the same GitHub repository and select its `render.yaml`.
2. The blueprint creates the FastAPI web service `resumemate-api` on Render's Free plan and uses `/api/health` for health checks.
3. When prompted, set:

   - `DATABASE_URL`: the Neon pooled connection string from step 1.
   - `CORS_ORIGINS`: a JSON array containing the exact Vercel production origin, for example `["https://your-project.vercel.app"]`. Add a custom domain here too if you use one.

   The blueprint generates `SECRET_KEY` for the service. Do not reuse your local development key.

4. After deployment, open `https://<your-render-service>.onrender.com/api/health`. Then confirm that Vercel's `VITE_API_BASE_URL` points to this Render service and redeploy the frontend if it changed.

The Blueprint uses Render's **Free** plan and writes temporary uploads under `/tmp/resumemate-uploads`. Render Free services spin down after 15 minutes without requests, take about a minute to wake on the next request, and lose local files whenever they restart, spin down, or redeploy. This means uploaded PDF/DOCX files may disappear even though their Neon database records remain. For persistent user uploads, add an external object-storage integration (for example, Cloudflare R2) before treating the deployment as production-ready.

### Connect a free Ollama model running on your computer

Render cannot reach your computer through `localhost`. This repository includes a small authenticated local gateway and a Cloudflare Worker proxy so Render can call Ollama without publishing Ollama's unauthenticated API. This is a hobby setup: your computer must stay on, Ollama and `cloudflared` must keep running, and Cloudflare Quick Tunnels do not provide a production uptime guarantee.

1. Install Ollama on your computer and download the smaller model used in this example:

   ```powershell
   ollama pull llama3.2:1b
   ```

2. Create a long random secret for the local gateway. In PowerShell, generate one with `python -c "import secrets; print(secrets.token_urlsafe(32))"`. Keep it private. Start the local authenticated gateway from the repository root:

   ```powershell
   $env:OLLAMA_PROXY_TOKEN = "<your-local-gateway-secret>"
   python .\cloudflare\ollama_auth_proxy.py
   ```

   The gateway listens only on `127.0.0.1:11435` and forwards authenticated requests to Ollama on `127.0.0.1:11434`.

3. Install `cloudflared` from Cloudflare's official instructions. In another terminal, create a temporary tunnel to the gateway:

   ```powershell
   cloudflared tunnel --url http://127.0.0.1:11435
   ```

   Copy the generated `https://....trycloudflare.com` URL. Keep this process open. Quick Tunnels are intended for development/testing; the URL changes when the tunnel restarts.

4. In Cloudflare Dashboard, create a Worker on its free `workers.dev` subdomain and paste the contents of `cloudflare/ollama-proxy.js`. In the Worker's **Settings → Variables and Secrets**, add:

   - `OLLAMA_UPSTREAM_URL` (secret): the generated Quick Tunnel URL, without a trailing slash.
   - `UPSTREAM_AUTH_TOKEN` (secret): the same value as `OLLAMA_PROXY_TOKEN` from step 2.
   - `BACKEND_API_KEY` (secret): a different long random secret, generated the same way.

   Deploy the Worker and note its URL, for example `https://resumemate-ollama.<your-subdomain>.workers.dev`. Open its `/health` path; it should say `Ollama proxy ready`.

5. In Render → `resumemate-api` → **Environment**, set:

   - `OLLAMA_BASE_URL`: the Worker URL, without a trailing slash.
   - `OLLAMA_MODEL`: `llama3.2:1b`.
   - `OLLAMA_API_KEY` (secret): the same value as the Worker `BACKEND_API_KEY`.

   Save and redeploy the Render service. The Worker accepts only authenticated `/api/tags` and `/api/generate` calls; the local gateway independently checks its own secret before forwarding to Ollama.

If you restart the Quick Tunnel, update `OLLAMA_UPSTREAM_URL` in the Worker and redeploy it. Do not share any of these secrets, and do not tunnel directly to Ollama port `11434`.

### Deployment environment variables

| Service | Variable | Value |
| --- | --- | --- |
| Render | `DATABASE_URL` | Neon pooled PostgreSQL URI, with TLS options |
| Render | `SECRET_KEY` | Generated by the Blueprint; keep private |
| Render | `CORS_ORIGINS` | JSON array of exact Vercel/custom frontend origins |
| Render | `UPLOAD_DIR` | `/tmp/resumemate-uploads` (temporary; files can be lost when the service sleeps or restarts) |
| Render | `OLLAMA_BASE_URL` | Cloudflare Worker URL for the authenticated Ollama proxy |
| Render | `OLLAMA_API_KEY` | Secret matching the Worker `BACKEND_API_KEY` |
| Render | `OLLAMA_MODEL` | Installed model name, e.g. `llama3.2:1b` |
| Vercel | `VITE_API_BASE_URL` | `https://<your-render-service>.onrender.com/api` |

## Main application routes

- `/dashboard` — resume and analysis overview
- `/builder` — create a resume
- `/edit-resume` — import an existing PDF/DOCX and manage saved versions
- `/analyzer` — ATS analysis
- `/job-matcher` — compare a resume with a job description
- `/history` — saved analysis history
- `/templates` — resume templates

## Backend API groups

All API routes are prefixed with `/api`. Interactive endpoint details are available at `/docs` while the backend is running.

- `/api/auth` — registration, login, demo login, and current-user details
- `/api/resumes` — resume CRUD, versions, and original-file retrieval
- `/api/upload` — resume import and parsing
- `/api/ai` — AI suggestions and Ollama status
- `/api/ats` — ATS analysis and analysis history
- `/api/job-match` — job-description comparison and match history
- `/api/pdf` — PDF generation and download

## Local storage

By default, application data is stored locally:

- Database: `backend/sql_app.db`
- Uploaded source resumes: `backend/uploads/`

Keep regular backups if you need to retain local accounts, resumes, or analysis history. These local files are intentionally ignored by Git.

## License

No license has been added yet. All rights remain with the project author unless a license is added to this repository.
