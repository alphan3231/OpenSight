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
# We might need to reload model if training updates it.
DEFAULT_MODEL_PATH = "yolov8n.pt"
model = YOLO(DEFAULT_MODEL_PATH) 

class PredictRequest(BaseModel):
    pass

class TrainRequest(BaseModel):
    epochs: int = 15
    imgsz: int = 640

from ..utils.yolo_converter import convert_to_yolo_format
from ..utils.device_manager import get_device

@router.post("/projects/{project_id}/train")
def train_model(project_id: str, request: TrainRequest, db: Session = Depends(get_db)):
    # 1. Get Project Classes
    project_dir = os.path.join(STORAGE_PATH, str(project_id))
    classes_file = os.path.join(project_dir, "classes.json")
    
    if not os.path.exists(classes_file):
         raise HTTPException(status_code=400, detail="No classes defined for this project.")
    
    with open(classes_file, "r") as f:
        classes = json.load(f)
        
    if not classes:
        raise HTTPException(status_code=400, detail="Class list is empty.")

    image_map = {str(img.id): img.file_path for img in images}

    # 3. Convert Data
    yaml_path = convert_to_yolo_format(project_id, STORAGE_PATH, classes, image_map)
    if not yaml_path:
        raise HTTPException(status_code=400, detail="Failed to prepare dataset. Are there any labels?")
        
    # 3. Train
    # We train a NEW model instance to avoid messing up global one concurrently? 
    # Actually, fine-tuning often usually starts from a base weights file.
    device = get_device()
    print(f"Starting training on device: {device}")
    
    train_model = YOLO("yolov8n.pt") # Always start from base for Stability? Or previous best? Let's start base.
    
    try:
        results = train_model.train(
            data=yaml_path, 
            epochs=request.epochs, 
            imgsz=request.imgsz, 
            device=device,
            project=os.path.join(project_dir, "runs"),
            name="train",
            exist_ok=True # Overwrite existing experiment 'train' folder
        )
    except Exception as e:
        print(f"Training failed: {e}")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")
        
    # 4. Locate Best Model
    # It should be in {project_dir}/runs/train/weights/best.pt
    best_model_path = os.path.join(project_dir, "runs", "train", "weights", "best.pt")
    
    if os.path.exists(best_model_path):
        return {"status": "success", "message": "Training complete", "model_path": best_model_path}
    else:
        # Sometimes file structure varies, let's verify
        return {"status": "warning", "message": "Training finished but model file not found at expected location."}


@router.post("/projects/{project_id}/images/{image_id}/predict", response_model=List[schemas.Annotation])
def predict_objects(project_id: str, image_id: str, db: Session = Depends(get_db)):
    project_dir = os.path.join(STORAGE_PATH, str(project_id))
    
    # Check for custom model
    custom_model_path = os.path.join(project_dir, "runs", "train", "weights", "best.pt")
    
    active_model = model
    if os.path.exists(custom_model_path):
        # We should load this dynamically. 
        # Loading a model takes time, so maybe cache it? 
        # For now, let's load it every time or do a simple cache check.
        # MVP: Load it.
        try:
            active_model = YOLO(custom_model_path)
        except Exception as e:
            print(f"Failed to load custom model, falling back to default: {e}")
            active_model = model
    
    images_dir = os.path.join(project_dir, "images")
    
    # Better: Query DB
    from ..models import Image
    image = db.query(Image).filter(Image.id == image_id, Image.project_id == project_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
        
    image_path = os.path.join(images_dir, image.file_path)
    
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Image file missing")

    # Run Inference
    results = active_model(image_path)
    
    # Process Results
    annotations = []
    
    for r in results:
        boxes = r.boxes
        for box in boxes:
            
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            w = x2 - x1
            h = y2 - y1
            
            cls_id = int(box.cls[0])
            # Use model names
            label = active_model.names[cls_id]
            
            annotations.append({
                "id": f"auto-{os.urandom(4).hex()}",
                "x": x1,
                "y": y1,
                "width": w,
                "height": h,
                "label": label
            })
            
    return annotations
