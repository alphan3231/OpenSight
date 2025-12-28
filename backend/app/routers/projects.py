from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import crud, models, schemas
from ..database import get_db
import os

router = APIRouter(
    prefix="/projects",
    tags=["projects"],
    responses={404: {"description": "Not found"}},
)

STORAGE_PATH = os.getenv("STORAGE_PATH", "/data")

@router.post("/", response_model=schemas.Project)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db)):
    db_project = crud.create_project(db=db, project=project)
    
    # Create project directory in storage
    project_path = os.path.join(STORAGE_PATH, str(db_project.id), "images")
    os.makedirs(project_path, exist_ok=True)
    
    return db_project

@router.get("/", response_model=List[schemas.Project])
def read_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    projects = crud.get_projects(db, skip=skip, limit=limit)
    return projects

@router.get("/{project_id}", response_model=schemas.Project)
def read_project(project_id: str, db: Session = Depends(get_db)):
    db_project = crud.get_project(db, project_id=project_id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project
