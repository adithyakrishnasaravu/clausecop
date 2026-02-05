from __future__ import annotations

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlmodel import Session, select

from app.db.models import Document, Project
from app.db.session import get_session

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("/")
def create_project(
    name: str = Body(..., embed=True),
    session: Session = Depends(get_session),
):
    """Create a new project (deal / engagement)."""
    project = Project(name=name)
    session.add(project)
    session.commit()
    session.refresh(project)
    return {"id": project.id, "name": project.name, "created_at": project.created_at.isoformat()}


@router.get("/")
def list_projects(session: Session = Depends(get_session)):
    """List all projects."""
    projects = session.exec(select(Project).order_by(Project.id.desc())).all()
    results = []
    for p in projects:
        doc_count = len(
            session.exec(select(Document).where(Document.project_id == p.id)).all()
        )
        results.append({
            "id": p.id,
            "name": p.name,
            "created_at": p.created_at.isoformat(),
            "document_count": doc_count,
        })
    return results


@router.get("/{project_id}")
def get_project(project_id: int, session: Session = Depends(get_session)):
    """Get project details with its documents."""
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    docs = session.exec(
        select(Document).where(Document.project_id == project_id).order_by(Document.id)
    ).all()

    return {
        "id": project.id,
        "name": project.name,
        "created_at": project.created_at.isoformat(),
        "documents": [
            {
                "id": d.id,
                "filename": d.filename,
                "display_name": d.display_name,
                "status": d.status,
                "num_pages": d.num_pages,
            }
            for d in docs
        ],
    }


@router.patch("/{project_id}")
def rename_project(
    project_id: int,
    name: str = Body(..., embed=True),
    session: Session = Depends(get_session),
):
    """Rename a project."""
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.name = name
    session.add(project)
    session.commit()
    session.refresh(project)
    return {"id": project.id, "name": project.name}


@router.delete("/{project_id}")
def delete_project(project_id: int, session: Session = Depends(get_session)):
    """Delete a project. Documents under it become unassigned (not deleted)."""
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Unlink documents rather than deleting them
    docs = session.exec(
        select(Document).where(Document.project_id == project_id)
    ).all()
    for d in docs:
        d.project_id = None
        session.add(d)

    session.delete(project)
    session.commit()
    return {"ok": True}
