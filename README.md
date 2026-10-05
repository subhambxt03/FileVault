<div align="center">

# 📁 FileVault

**Upload once. Process in the background. Get results when they're ready. ⚡**

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2-D71F00?logo=sqlalchemy&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-28A745)

[**🌐 Live Demo**](https://fileevaultt.netlify.app) ·
[**🔌 API**](https://filevault-n9at.onrender.com) ·
[**📚 API Docs**](https://filevault-n9at.onrender.com/docs) ·
[**💻 GitHub**](https://github.com/subhambxt03/FileVault)

</div>

---

## 📋 Overview

**FileVault** is a production-style asynchronous file-processing platform. Users
upload images, PDFs, and plain text files. The API returns a job ID **immediately**
— processing happens in a background thread — and progress is tracked live from
a React dashboard.

Built to demonstrate real-world backend engineering: background processing with
retries and exponential backoff, object storage with signed URLs, JWT auth,
database persistence through Alembic migrations, webhook notifications, and a
premium responsive frontend.

> 📂 **Upload • Queue • Process • Download**

---

## ✨ Features

### 🔐 Authentication
- Register / login with JWT access tokens
- Argon2 password hashing
- Profile management with avatar upload
- Password change flow
- Light / Dark / System themes

### 📤 Upload
- Drag-and-drop UI with upload progress
- MIME + extension validation
- 10 MB hard limit enforced server-side
- Filename sanitization (no path traversal)
- Immediate job ID — never blocks the request

### ⚙️ Processing
- **Images** — small / medium / large variants (320 / 800 / 1280 px) via Pillow
- **PDFs** — extract plain text from every page via PyMuPDF
- **Text** — compute top-50 word frequency
- Automatic retries with exponential backoff (10s → 60s → 300s)
- Full job timeline: `QUEUED → PROCESSING → DONE` / `FAILED`

### 🗄️ Storage
- S3-compatible object storage (Cloudflare R2, AWS S3, or MinIO locally)
- Never relies on local filesystem for permanent storage
- Signed download URLs with expiry
- Original and processed outputs stored separately

### 🔔 Notifications & Webhooks
- In-app notification center
- User-configurable webhooks: `file.processing.completed` / `file.processing.failed`
- Events fire on success, failure, and retry

### 📊 Dashboard
- Total / processing / completed / failed counters
- Uploads over the last 14 days (line chart)
- Success vs failure (pie chart)
- File type distribution (bar chart)
- Recent jobs table with status badges

### 🔌 Integrations
- Google Drive, Dropbox, GitHub, Slack stubs
- Full OAuth flow when provider credentials are configured
- Development-only "Demo connect" mode

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router, Axios, Tailwind CSS, Recharts, Lucide |
| **Backend** | FastAPI, SQLAlchemy 2, Alembic, Pydantic v2 |
| **Database** | MySQL 8 (TiDB Cloud in production) |
| **Background work** | Python `threading` with manual retry + backoff |
| **Storage** | S3-compatible (Cloudflare R2 in production, MinIO locally) |
| **Auth** | JWT (PyJWT), Argon2 (passlib) |
| **Processing** | Pillow, PyMuPDF, standard library |
| **Deployment** | Docker, Render, Netlify |

---

## 🏗️ Architecture
┌──────────────────┐
│ React frontend │ Netlify
│ (Vite + TW) │
└────────┬─────────┘
│ HTTPS / JWT
▼
┌──────────────────────────────────┐
│ FastAPI backend │ Render
│ (uvicorn) │
│ │
│ ┌────────────────────────────┐ │
│ │ Background thread │ │
│ │ (per upload) │ │
│ │ → retries + backoff │ │
│ │ → processing │ │
│ │ → webhook on finish │ │
│ └──────────┬─────────────────┘ │
└─────────────┼────────────────────┘
│
▼
┌───────────────┐
│ MySQL (TiDB) │
└───────────────┘
▲
│
┌───────────────┐
│ Object storage│
│ (R2 / S3) │
└───────────────┘

text

When a user uploads a file, the API returns a job ID instantly, then spawns a
daemon thread that handles the processing off the request path. Retries, status
updates, and webhook delivery all happen inside that thread.

---

🔄 How It Works
Upload Flow
POST /files/upload receives the multipart file

Backend validates MIME type, extension, and size

A jobs row is created with status QUEUED

Original file is uploaded to S3-compatible storage

A daemon thread is spawned to process the job

API returns the job ID and status immediately

The thread sets status to PROCESSING

It downloads the file, processes it, uploads outputs to storage

Status becomes DONE (or FAILED after 3 retries)

A notification is created; a webhook fires if configured

Frontend polls /jobs/{id}/status every 3 seconds until finished



🚀 Deployment
Frontend — Netlify
Connect the GitHub repo

netlify.toml sets base directory to frontend

Add environment variable:

VITE_API_BASE_URL=https://<your-render-service>.onrender.com

Deploy

Backend — Render
Connect the GitHub repo

Render reads render.yaml to provision the web service

Set the following env vars in the dashboard:

DATABASE_URL (TiDB or any MySQL 8)

DB_SSL_CA (e.g. /app/certs/isrgrootx1.pem)

S3_ENDPOINT_URL, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY

BACKEND_CORS_ORIGINS (your Netlify URL)

SECRET_KEY (long random value)

Deploy

Database — TiDB Cloud (Free)
Create a Serverless cluster at https://tidbcloud.com

Copy the connection string and CA certificate

Store the CA at backend/certs/isrgrootx1.pem and commit it

Run migrations locally against the cluster:

bash
alembic upgrade head
Object Storage — Cloudflare R2 (Free)
Create a bucket named fileflow

Create an R2 API token with Object Read & Write for that bucket

Set the S3 env vars in Render


🔮 Future Improvements
□ 🔌 Introduce a durable queue (Celery + Redis) for job persistence across restarts
□ ⚡ Real-time job updates via WebSockets instead of polling
□ 📦 Chunked / resumable uploads for large files
□ 🖼️ Preview thumbnails for PDFs
□ 📂 Batch upload
□ 🛠️ Admin dashboard for queue depth and worker health
□ 🔑 Password reset flow
□ ✉️ Email verification
□ 🚦 Rate limiting per IP and per user
👨‍💻 Author
Shubham Bisht
Web Developer & Designer

https://img.shields.io/badge/GitHub-subhambxt03-181717?logo=github&logoColor=white

https://img.shields.io/badge/Portfolio-GX%20Shubham-FFAE24

📄 License
This project is licensed under the MIT License.

You are free to use, modify, and distribute this project according to the terms
of the license.

<div align="center">
⭐ Star this repository if you enjoyed the project!
Made with ❤️ and 🗂️ by Shubham

</div> ```
