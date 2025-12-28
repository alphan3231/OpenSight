from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import projects, images
import os

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="OpenSight API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(images.router)

# Mount static files
STORAGE_PATH = os.getenv("STORAGE_PATH", "/data")
os.makedirs(STORAGE_PATH, exist_ok=True)
app.mount("/static", StaticFiles(directory=STORAGE_PATH), name="static")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "OpenSight Backend"}
