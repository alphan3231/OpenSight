from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
import os
import json
from pydantic import BaseModel

router = APIRouter(
    tags=["classes"],
    responses={404: {"description": "Not found"}},
)

STORAGE_PATH = os.getenv("STORAGE_PATH", "/data")

class ClassList(BaseModel):
    classes: List[str]

@router.get("/projects/{project_id}/classes", response_model=ClassList)
def get_classes(project_id: str):
    project_dir = os.path.join(STORAGE_PATH, str(project_id))
    classes_file = os.path.join(project_dir, "classes.json")
    
    if not os.path.exists(classes_file):
        return {"classes": []}
        
    try:
        with open(classes_file, "r") as f:
            data = json.load(f)
            return {"classes": data}
    except Exception as e:
        print(f"Error reading classes: {e}")
        return {"classes": []}

@router.post("/projects/{project_id}/classes")
def save_classes(
    project_id: str, 
    class_list: ClassList
):
    project_dir = os.path.join(STORAGE_PATH, str(project_id))
    os.makedirs(project_dir, exist_ok=True)
    classes_file = os.path.join(project_dir, "classes.json")
    
    with open(classes_file, "w") as f:
        json.dump(class_list.classes, f)
    
    return {"status": "success", "count": len(class_list.classes)}
