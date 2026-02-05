from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class Project(SQLModel, table=True):
    """A deal / engagement containing one or more related documents."""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# definition of the Document model in the database
class Document(SQLModel, table=True):
    """
    it's job:
    - stores uploaded file information
    - gives each file a unique ID
    - gives "current status" of pipeline processing
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: Optional[int] = Field(default=None, foreign_key="project.id", index=True)
    filename: str
    status: str
    file_path: str
    num_pages: Optional[int] = Field(default=None)
    error_message: Optional[str] = Field(default=None)
    display_name: Optional[str] = Field(default=None)
    total_clauses: Optional[int] = Field(default=None)
    clauses_done: Optional[int] = Field(default=None)


# definition of a Clause model in the database
class Clause(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    document_id: int = Field(foreign_key="document.id", index=True)

    clause_index: int = Field(index=True)  # 0..N in reading order

    section_number: Optional[str] = Field(default=None, index=True)
    title: Optional[str] = Field(default=None, index=True)

    category: str = Field(default="Other", index=True)
    confidence: Optional[float] = Field(default=None)

    page_start: int = Field(index=True)
    page_end: int = Field(index=True)

    text: str


class RiskAssessment(SQLModel, table=True):
    """
    Stores the risk analysis result for a single clause.
    One-to-one with Clause.
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    clause_id: int = Field(foreign_key="clause.id", index=True, unique=True)

    category: str = Field(index=True)              # classified clause type
    risk_score: float = Field(index=True)           # 0-100
    severity: str = Field(index=True)               # low / medium / high / critical

    signals: str                                    # JSON-encoded dict of bool flags
    summary: str                                    # plain-English risk explanation
    recommendation: str                             # negotiation suggestion

    assessed_by: str                                # model version used
    assessed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

