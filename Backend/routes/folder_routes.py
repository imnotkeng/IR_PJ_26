from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List
from datetime import datetime

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import get_db
from models import Folder  

router = APIRouter(prefix="/api/folders", tags=["Folders"])

# --- Pydantic Schemas ---
class FolderCreate(BaseModel):
    name: str = Field(..., max_length=100)
    user_id: int

class FolderResponse(BaseModel):
    id: int
    user_id: int
    name: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Routes ---

@router.get("", response_model=List[FolderResponse])
def get_folders(user_id: int, db: Session = Depends(get_db)):
    """Fetch all folders for a specific user"""
    folders = db.query(Folder).filter(Folder.user_id == user_id).all()
    return folders

@router.post("", response_model=FolderResponse, status_code=status.HTTP_201_CREATED)
def create_folder(folder: FolderCreate, db: Session = Depends(get_db)):
    """Create a new folder"""
    new_folder = Folder(name=folder.name, user_id=folder.user_id)
    db.add(new_folder)
    db.commit()
    db.refresh(new_folder)
    return new_folder

@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_folder(folder_id: int, db: Session = Depends(get_db)):
    """Delete a folder by ID"""
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    db.delete(folder)
    db.commit()
    return None