from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
import os
import json
from pydantic import BaseModel
from ultralytics import YOLO
from .. import schemas

router = APIRouter(
    tags=["ai"],
    responses={404: {"description": "Not found"}},
)

STORAGE_PATH = os.getenv("STORAGE_PATH", "/data")

# Initialize Model (Lazy load or global)
# Using yolov8n for speed. It will download to current dir on first run.
model = YOLO("yolov8n.pt") 

class PredictRequest(BaseModel):
    pass # No body needed strictly, but good for future options

@router.post("/projects/{project_id}/images/{image_id}/predict", response_model=List[schemas.Annotation])
def predict_objects(project_id: str, image_id: str, db: Session = Depends(get_db)):
    project_dir = os.path.join(STORAGE_PATH, str(project_id))
    
    # We need to find the filename. Since we don't have it in the URL, we can look it up in DB
    # OR simpler: look in the images folder if we assume standard naming? 
    # Actually, we should query DB to get the file path.
    # But for now, to save a DB query if possible... 
    # Let's just look in the images dir.
    
    images_dir = os.path.join(project_dir, "images")
    
    # Hacky: find the file with this ID
    target_file = None
    if os.path.exists(images_dir):
        for f in os.listdir(images_dir):
            if f.startswith(image_id): # Since filename usually has UUID prefix or we stored it weirdly?
                # Wait, earlier code: filename is just stored.
                # Let's use the DB to be safe.
                pass
    
    # Better: Query DB
    from ..models import Image
    image = db.query(Image).filter(Image.id == image_id, Image.project_id == project_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
        
    image_path = os.path.join(images_dir, image.file_path)
    
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Image file missing")

    # Run Inference
    results = model(image_path)
    
    # Process Results
    annotations = []
    
    for r in results:
        boxes = r.boxes
        for box in boxes:
            # box.xywh is center_x, center_y, width, height
            # box.xyxy is x1, y1, x2, y2
            # Our BBox component expects x, y (top-left), width, height
            
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            w = x2 - x1
            h = y2 - y1
            
            cls_id = int(box.cls[0])
            label = model.names[cls_id]
            
            annotations.append({
                "id": f"auto-{os.urandom(4).hex()}",
                "x": x1,
                "y": y1,
                "width": w,
                "height": h,
                "label": label
            })
            
    return annotations
