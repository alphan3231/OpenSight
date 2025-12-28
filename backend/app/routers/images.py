from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import crud, models, schemas
from ..database import get_db
import shutil
import os
import uuid

router = APIRouter(
    tags=["images"],
    responses={404: {"description": "Not found"}},
)

STORAGE_PATH = os.getenv("STORAGE_PATH", "/data")

@router.post("/projects/{project_id}/images", response_model=schemas.Image)
def upload_image(project_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Verify project exists
    db_project = crud.get_project(db, project_id=project_id)
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Define path
    file_uuid = uuid.uuid4()
    extension = os.path.splitext(file.filename)[1]
    safe_filename = f"{file_uuid}{extension}"
    project_dir = os.path.join(STORAGE_PATH, str(project_id), "images")
    file_location = os.path.join(project_dir, safe_filename)

    # Ensure directory exists (redundancy check)
    os.makedirs(project_dir, exist_ok=True)

    # Save file
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
    
    # Get file size
    file_size = os.path.getsize(file_location)

    # Create DB record
    image_data = schemas.ImageCreate(filename=file.filename, file_size=file_size)
    db_image = crud.create_image(db=db, image=image_data, project_id=project_id, file_path=safe_filename)
    
    return db_image
