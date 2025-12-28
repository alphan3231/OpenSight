import os
import shutil
import yaml
import json
from typing import List

def convert_to_yolo_format(project_id: str, storage_path: str, classes: List[str]):
    """
    Converts project annotations to YOLO directory structure and format.
    
    Structure:
    /data/{project_id}/dataset/
        data.yaml
        train/
            images/
            labels/
        val/
            images/
            labels/
    """
    project_dir = os.path.join(storage_path, str(project_id))
    dataset_dir = os.path.join(project_dir, "dataset")
    
    # Clean up existing dataset build to avoid staleness
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
    
    # We will use all images for training for now (simple approach) or 90/10 split?
    # Let's do 100% train for this MVP or simple split if we had more data.
    # User asked for "dynamic learning", likely small dataset. 100% train is risky for overfitting but ensures it learns the few examples given.
    # Let's use the same data for val to ensure mAP allows checking if it learned AT ALL.
    
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
        
        # Determine image extension (we need to find the file)
        # This is a bit tricky without DB access, but let's scan images_source_dir
        image_filename = None
        for img_f in os.listdir(images_source_dir):
            if img_f.startswith(image_id): 
                image_filename = img_f
                break
        
        if not image_filename:
            continue
            
        # Copy Image to Train AND Val
        src_img_path = os.path.join(images_source_dir, image_filename)
        shutil.copy(src_img_path, os.path.join(train_images_dir, image_filename))
        shutil.copy(src_img_path, os.path.join(val_images_dir, image_filename))
        
        # Process and Write Label
        with open(os.path.join(labels_source_dir, label_file), 'r') as f:
            annotations = json.load(f)
            
        yolo_lines = []
        
        # We need image dimensions to normalize. 
        # Ultralytics might handle non-normalized? No, YOLO txt format requires normalized xywh.
        # We need to open the image to get size.
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
            
            # Box: x, y, width, height (Top-Left)
            # YOLO: center_x, center_y, width, height (Normalized)
            
            x_center = (ann['x'] + ann['width'] / 2) / w
            y_center = (ann['y'] + ann['height'] / 2) / h
            norm_width = ann['width'] / w
            norm_height = ann['height'] / h
            
            # Clip to [0, 1] just in case
            x_center = max(0, min(1, x_center))
            y_center = max(0, min(1, y_center))
            norm_width = max(0, min(1, norm_width))
            norm_height = max(0, min(1, norm_height))
            
            yolo_lines.append(f"{cls_id} {x_center} {y_center} {norm_width} {norm_height}")
            
        # Write .txt file
        txt_filename = os.path.splitext(image_filename)[0] + ".txt"
        with open(os.path.join(train_labels_dir, txt_filename), "w") as f:
            f.write("\n".join(yolo_lines))
        with open(os.path.join(val_labels_dir, txt_filename), "w") as f:
            f.write("\n".join(yolo_lines))

        count += 1

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
