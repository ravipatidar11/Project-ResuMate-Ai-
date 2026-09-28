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
