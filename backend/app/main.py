import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    auth,
    files,
    integrations,
    jobs,
    notifications,
    preview,
    statistics,
    webhooks,
)
from app.utils.logging import configure_logging

configure_logging()
logger = logging.getLogger("fileflow")

app = FastAPI(
    title="FileFlow API",
    description="Asynchronous file-processing platform.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(files.router)
app.include_router(jobs.router)
app.include_router(notifications.router)
app.include_router(webhooks.router)
app.include_router(statistics.router)
app.include_router(integrations.router)
app.include_router(preview.router)


@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "env": settings.APP_ENV}