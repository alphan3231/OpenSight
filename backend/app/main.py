from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import projects, images

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

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "OpenSight Backend"}
