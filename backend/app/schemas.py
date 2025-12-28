from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class ImageBase(BaseModel):
    filename: str
    file_size: int

class ImageCreate(ImageBase):
    pass

class Image(ImageBase):
    id: UUID
    project_id: UUID
    file_path: str
    created_at: datetime

    class Config:
        orm_mode = True

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: UUID
    created_at: datetime
    images: List[Image] = []

    class Config:
        orm_mode = True
