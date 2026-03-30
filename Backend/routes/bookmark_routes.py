from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel, Field
from typing import List
from datetime import datetime

from database import get_db
from models import Bookmark, Folder, User # Adjust import as needed

router = APIRouter(prefix="/api/bookmarks", tags=["Bookmarks"])

# --- Schemas ---
class BookmarkCreate(BaseModel):
    user_id: int
    folder_id: int
    recipe_id: int
    rating: int = Field(..., ge=1, le=5, description="Rating must be between 1 and 5")

class BookmarkResponse(BaseModel):
    id: int
    user_id: int
    folder_id: int
    recipe_id: int
    rating: int
    folder_name: str  # We include the folder name for the frontend UI
    created_at: datetime

    class Config:
        from_attributes = True

# --- Routes ---

@router.get("/{user_id}", response_model=List[BookmarkResponse])
def get_user_bookmarks(user_id: int, db: Session = Depends(get_db)):
    """Fetch all bookmarks for a user, sorted by highest rating first."""
    # Query bookmarks and join with Folder to get the folder name
    bookmarks = (
        db.query(Bookmark, Folder.name.label("folder_name"))
        .join(Folder, Bookmark.folder_id == Folder.id)
        .filter(Bookmark.user_id == user_id)
        .order_by(desc(Bookmark.rating)) # Rank by rating descending (5 stars first)
        .all()
    )
    
    # Format the response
    return [
        {
            "id": b.Bookmark.id,
            "user_id": b.Bookmark.user_id,
            "folder_id": b.Bookmark.folder_id,
            "recipe_id": b.Bookmark.recipe_id,
            "rating": b.Bookmark.rating,
            "folder_name": b.folder_name,
            "created_at": b.Bookmark.created_at
        }
        for b in bookmarks
    ]

@router.get("/folder/{folder_id}", response_model=List[BookmarkResponse])
def get_bookmarks_by_folder(folder_id: int, db: Session = Depends(get_db)):
    """Fetch all bookmarks inside a specific folder."""
    bookmarks = (
        db.query(Bookmark, Folder.name.label("folder_name"))
        .join(Folder, Bookmark.folder_id == Folder.id)
        .filter(Bookmark.folder_id == folder_id)
        .order_by(desc(Bookmark.rating)) # Rank by rating descending
        .all()
    )
    
    return [
        {
            "id": b.Bookmark.id,
            "user_id": b.Bookmark.user_id,
            "folder_id": b.Bookmark.folder_id,
            "recipe_id": b.Bookmark.recipe_id,
            "rating": b.Bookmark.rating,
            "folder_name": b.folder_name,
            "created_at": b.Bookmark.created_at
        }
        for b in bookmarks
    ]

@router.post("", response_model=BookmarkResponse, status_code=status.HTTP_201_CREATED)
def create_bookmark(bookmark: BookmarkCreate, db: Session = Depends(get_db)):
    """Create a new bookmark."""
    # Ensure folder belongs to user
    folder = db.query(Folder).filter(Folder.id == bookmark.folder_id, Folder.user_id == bookmark.user_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found or does not belong to user")

    # Check if user already bookmarked this recipe
    existing = db.query(Bookmark).filter(
        Bookmark.user_id == bookmark.user_id, 
        Bookmark.recipe_id == bookmark.recipe_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Recipe already bookmarked. Please edit existing bookmark.")

    new_bookmark = Bookmark(
        user_id=bookmark.user_id,
        folder_id=bookmark.folder_id,
        recipe_id=bookmark.recipe_id,
        rating=bookmark.rating
    )
    db.add(new_bookmark)
    db.commit()
    db.refresh(new_bookmark)

    return {
        "id": new_bookmark.id,
        "user_id": new_bookmark.user_id,
        "folder_id": new_bookmark.folder_id,
        "recipe_id": new_bookmark.recipe_id,
        "rating": new_bookmark.rating,
        "folder_name": folder.name,
        "created_at": new_bookmark.created_at
    }

@router.delete("/{bookmark_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bookmark(bookmark_id: int, db: Session = Depends(get_db)):
    """Delete a bookmark by ID"""
    bookmark = db.query(Bookmark).filter(Bookmark.id == bookmark_id).first()
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    db.delete(bookmark)
    db.commit()
    return None