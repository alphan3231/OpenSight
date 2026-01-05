from sqlalchemy.orm import Session
from . import models, schemas
import uuid

def get_projects(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Project).offset(skip).limit(limit).all()

def create_project(db: Session, project: schemas.ProjectCreate):
    db_project = models.Project(name=project.name, description=project.description)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

def get_project(db: Session, project_id: uuid.UUID):
    return db.query(models.Project).filter(models.Project.id == project_id).first()

def update_project(db: Session, project_id: uuid.UUID, project: schemas.ProjectCreate):
    db_project = get_project(db, project_id)
    if db_project:
        db_project.name = project.name
        db_project.description = project.description
        db.commit()
        db.refresh(db_project)
    return db_project

def create_image(db: Session, image: schemas.ImageCreate, project_id: uuid.UUID, file_path: str):
    db_image = models.Image(
        project_id=project_id,
        filename=image.filename,
        file_size=image.file_size,
        file_path=file_path
    )
    db.add(db_image)
    db.commit()
    db.refresh(db_image)
    return db_image
