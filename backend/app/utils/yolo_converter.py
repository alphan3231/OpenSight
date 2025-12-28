import os
import shutil
import yaml
import json
from typing import List

def convert_to_yolo_format(project_id: str, storage_path: str, classes: List[str], image_map: dict):
    """
    Converts project annotations to YOLO directory structure and format.
    image_map: dict mapping image_id -> filename (e.g. {'uuid1': 'uuid2.jpg'})
    """
    project_dir = os.path.join(storage_path, str(project_id))
    dataset_dir = os.path.join(project_dir, "dataset")
    
    # ... (cleanup code)
    if os.path.exists(dataset_dir):
        shutil.rmtree(dataset_dir)
    
    # Create structure
    train_images_dir = os.path.join(dataset_dir, "train", "images")
    train_labels_dir = os.path.join(dataset_dir, "train", "labels")
    val_images_dir = os.path.join(dataset_dir, "val", "images")
    val_labels_dir = os.path.join(dataset_dir, "val", "labels")
    
    os.makedirs(train_images_dir, exist_ok=True)
    os.makedirs(train_labels_dir, exist_ok=True)
    os.makedirs(val_images_dir, exist_ok=True)
    os.makedirs(val_labels_dir, exist_ok=True)
    
    images_source_dir = os.path.join(project_dir, "images")
    labels_source_dir = os.path.join(project_dir, "labels")
    
    if not os.path.exists(labels_source_dir):
        print("No labels found.")
        return None

    # Map class names to IDs
    class_map = {name: idx for idx, name in enumerate(classes)}
    
    files = [f for f in os.listdir(labels_source_dir) if f.endswith(".json")]
    
    count = 0
    for label_file in files:
        image_id = label_file.replace(".json", "")
        
        # Use provided map to find filename
        image_filename = image_map.get(image_id)
        
        if not image_filename or not os.path.exists(os.path.join(images_source_dir, image_filename)):
            print(f"Image not found for ID {image_id}")
            continue
            
        # Copy Image to Train AND Val
        src_img_path = os.path.join(images_source_dir, image_filename)
        shutil.copy(src_img_path, os.path.join(train_images_dir, image_filename))
        shutil.copy(src_img_path, os.path.join(val_images_dir, image_filename))
        
        # ... (rest of logic: read annotations, normalize, write txt)
        with open(os.path.join(labels_source_dir, label_file), 'r') as f:
            annotations = json.load(f)
            
        yolo_lines = []
        
        import cv2
        img = cv2.imread(src_img_path)
        if img is None:
            continue
        h, w, _ = img.shape
        
        for ann in annotations:
            label_name = ann.get('label')
            if label_name not in class_map:
                continue
            
            cls_id = class_map[label_name]
            
            x_center = (ann['x'] + ann['width'] / 2) / w
            y_center = (ann['y'] + ann['height'] / 2) / h
            norm_width = ann['width'] / w
            norm_height = ann['height'] / h
            
            x_center = max(0, min(1, x_center))
            y_center = max(0, min(1, y_center))
            norm_width = max(0, min(1, norm_width))
            norm_height = max(0, min(1, norm_height))
            
            yolo_lines.append(f"{cls_id} {x_center} {y_center} {norm_width} {norm_height}")
            
        txt_filename = os.path.splitext(image_filename)[0] + ".txt"
        with open(os.path.join(train_labels_dir, txt_filename), "w") as f:
            f.write("\n".join(yolo_lines))
        with open(os.path.join(val_labels_dir, txt_filename), "w") as f:
            f.write("\n".join(yolo_lines))

        count += 1
    
    # Create data.yaml ...

    # Create data.yaml
    yaml_content = {
        'path': dataset_dir, # Absolute or relative path? Ultralytics likes abs usually.
        'train': 'train/images',
        'val': 'val/images',
        'names': {idx: name for name, idx in class_map.items()}
    }
    
    yaml_path = os.path.join(dataset_dir, "data.yaml")
    with open(yaml_path, "w") as f:
        yaml.dump(yaml_content, f)
        
    return yaml_path
