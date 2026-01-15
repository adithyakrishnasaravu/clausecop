from __future__ import annotations

from typing import Optional

from sqlmodel import Field, SQLModel

# definition of the Document model in the database
class Document(SQLModel, table=True):
    """
    it's job:
    - stores uploaded file information
    - gives each file a unique ID
    - gives "current status" of pipeline processing
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    filename: str
    status: str
    file_path: str
