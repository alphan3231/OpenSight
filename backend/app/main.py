from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import projects, images, annotations
import os

# Create tables with retry logic
import time
from sqlalchemy.exc import OperationalError

MAX_RETRIES = 10
RETRY_DELAY = 2

for i in range(MAX_RETRIES):
    try:
        Base.metadata.create_all(bind=engine)
        print("Database connected and tables created.")
        break
    except OperationalError as e:
        if i == MAX_RETRIES - 1:
            print(f"Failed to connect to database after {MAX_RETRIES} attempts.")
            raise e
        print(f"Database not ready. Retrying in {RETRY_DELAY} seconds... ({i+1}/{MAX_RETRIES})")
        time.sleep(RETRY_DELAY)

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
app.include_router(annotations.router)

# Mount static files
STORAGE_PATH = os.getenv("STORAGE_PATH", "/data")
os.makedirs(STORAGE_PATH, exist_ok=True)
app.mount("/static", StaticFiles(directory=STORAGE_PATH), name="static")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "OpenSight Backend"}
