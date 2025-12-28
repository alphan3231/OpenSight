from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List
from .. import crud, models, schemas
from ..database import get_db
import os
import json

router = APIRouter(
    tags=["annotations"],
    responses={404: {"description": "Not found"}},
)

STORAGE_PATH = os.getenv("STORAGE_PATH", "/data")

@router.get("/projects/{project_id}/images/{image_id}/annotations", response_model=List[schemas.Annotation])
def get_annotations(project_id: str, image_id: str, db: Session = Depends(get_db)):
    # Verify image exists
    # For speed, we skip strict DB check if file exists, but good practice is to check DB.
    # We'll just look for the file.
    
    project_dir = os.path.join(STORAGE_PATH, str(project_id))
    labels_dir = os.path.join(project_dir, "labels")
    annotation_file = os.path.join(labels_dir, f"{image_id}.json")
    
    if not os.path.exists(annotation_file):
        return []
        
    try:
        with open(annotation_file, "r") as f:
            data = json.load(f)
            return data
    except Exception as e:
        print(f"Error reading annotations: {e}")
        return []

@router.post("/projects/{project_id}/images/{image_id}/annotations")
def save_annotations(
    project_id: str, 
    image_id: str, 
    annotations: List[schemas.Annotation], 
    db: Session = Depends(get_db)
):
    project_dir = os.path.join(STORAGE_PATH, str(project_id))
    labels_dir = os.path.join(project_dir, "labels")
    os.makedirs(labels_dir, exist_ok=True)
    
    annotation_file = os.path.join(labels_dir, f"{image_id}.json")
    
    # Convert Pydantic models to dict
    data = [ann.dict() for ann in annotations]
    
    with open(annotation_file, "w") as f:
        json.dump(data, f)
    
    return {"status": "success", "count": len(annotations)}
