from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel

from app.api.routes import documents
from app.core.config import settings
from app.db import models  # noqa: F401
from app.db.session import engine

app = FastAPI(title="ClauseCop API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup() -> None:
    SQLModel.metadata.create_all(engine)

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

app.include_router(documents.router)
