from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel

from app.api.routes import clauses, documents, projects, qa
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

    # Add progress columns to existing DBs (no-op if they already exist)
    import sqlalchemy
    with engine.connect() as conn:
        inspector = sqlalchemy.inspect(engine)
        existing = {c["name"] for c in inspector.get_columns("document")}
        if "total_clauses" not in existing:
            conn.execute(sqlalchemy.text("ALTER TABLE document ADD COLUMN total_clauses INTEGER"))
        if "clauses_done" not in existing:
            conn.execute(sqlalchemy.text("ALTER TABLE document ADD COLUMN clauses_done INTEGER"))
        conn.commit()

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

app.include_router(documents.router)
app.include_router(clauses.router)
app.include_router(clauses.clause_router)
app.include_router(projects.router)
app.include_router(qa.router)
