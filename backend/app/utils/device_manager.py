import torch
import logging

def get_device():
    """
    Detects the best available device for training/inference.
    Returns: '0' (CUDA), 'mps' (Apple Silicon), or 'cpu'.
    """
    if torch.cuda.is_available():
        logging.info("Device: CUDA (NVIDIA GPU) detected.")
        return '0' # Ultralytics uses '0' for first GPU
    
    if torch.backends.mps.is_available():
        logging.info("Device: MPS (Apple Silicon) detected.")
        return 'mps'
    
    logging.info("Device: CPU detected.")
    return 'cpu'
