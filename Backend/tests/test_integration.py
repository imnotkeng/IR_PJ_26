"""
INTEGRATION TESTS — Recipe App API
==================================
Tests how MULTIPLE COMPONENTS work TOGETHER.
Uses real database (SQLite in-memory), tests features, interactions.

Run:
    pytest test_recipe_app_integration.py -v
"""

import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, TIMESTAMP, CheckConstraint, event
from sqlalchemy.orm import sessionmaker, declarative_base, Session, relationship
from sqlalchemy.sql import func
from sqlalchemy.pool import StaticPool
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import jwt
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

# ──────────────────────────────────────────────
# Models & Database Setup
# ──────────────────────────────────────────────
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    folders = relationship("Folder", back_populates="owner", cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="user", cascade="all, delete-orphan")

class Folder(Base):
    __tablename__ = "folders"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    owner = relationship("User", back_populates="folders")
    bookmarks = relationship("Bookmark", back_populates="folder", cascade="all, delete-orphan")

class Bookmark(Base):
    __tablename__ = "bookmarks"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    folder_id = Column(Integer, ForeignKey("folders.id", ondelete="CASCADE"), nullable=False)
    recipe_id = Column(Integer, nullable=False)
    rating = Column(Integer, CheckConstraint('rating >= 1 AND rating <= 5'))
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    user = relationship("User", back_populates="bookmarks")
    folder = relationship("Folder", back_populates="bookmarks")

# ✅ FIX: Use StaticPool to keep in-memory DB across connections
# and enable foreign keys for SQLite
engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)

# Enable foreign key constraints in SQLite
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

TestingSessionLocal = sessionmaker(bind=engine, expire_on_commit=False)

def get_test_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

# ──────────────────────────────────────────────
# Auth setup
# ──────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "test-secret"
ALGORITHM = "HS256"

def hash_password(p: str) -> str:
    return pwd_context.hash(p)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(email: str) -> str:
    return jwt.encode(
        {"sub": email, "exp": datetime.utcnow() + timedelta(hours=1)},
        SECRET_KEY, algorithm=ALGORITHM
    )

def decode_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except:
        return None

# ──────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────
class SignUpRequest(BaseModel):
    username: str
    email: str
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    email: str

class FolderCreate(BaseModel):
    name: str
    user_id: int

class FolderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    name: str

class BookmarkCreate(BaseModel):
    user_id: int
    folder_id: int
    recipe_id: int
    rating: int

class BookmarkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    folder_id: int
    recipe_id: int
    rating: int
    folder_name: str

# ──────────────────────────────────────────────
# App setup
# ──────────────────────────────────────────────
app = FastAPI()

@app.post("/auth/signup", response_model=UserResponse, status_code=201)
def signup(body: SignUpRequest, db: Session = Depends(get_test_db)):
    user = User(username=body.username, email=body.email, password_hash=hash_password(body.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@app.post("/api/folders", response_model=FolderResponse, status_code=201)
def create_folder(body: FolderCreate, db: Session = Depends(get_test_db)):
    f = Folder(name=body.name, user_id=body.user_id)
    db.add(f)
    db.commit()
    db.refresh(f)
    return f

@app.get("/api/folders", response_model=List[FolderResponse])
def get_folders(user_id: int, db: Session = Depends(get_test_db)):
    return db.query(Folder).filter(Folder.user_id == user_id).all()

@app.post("/api/bookmarks", response_model=BookmarkResponse, status_code=201)
def create_bookmark(body: BookmarkCreate, db: Session = Depends(get_test_db)):
    folder = db.query(Folder).filter(
        Folder.id == body.folder_id, Folder.user_id == body.user_id
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    existing = db.query(Bookmark).filter(
        Bookmark.user_id == body.user_id, Bookmark.recipe_id == body.recipe_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already bookmarked")
    
    b = Bookmark(user_id=body.user_id, folder_id=body.folder_id,
                 recipe_id=body.recipe_id, rating=body.rating)
    db.add(b)
    db.commit()
    db.refresh(b)
    return {"id": b.id, "user_id": b.user_id, "folder_id": b.folder_id,
            "recipe_id": b.recipe_id, "rating": b.rating, "folder_name": folder.name}

@app.get("/api/bookmarks/{user_id}", response_model=List[BookmarkResponse])
def get_bookmarks(user_id: int, db: Session = Depends(get_test_db)):
    rows = (db.query(Bookmark, Folder.name.label("folder_name"))
              .join(Folder, Bookmark.folder_id == Folder.id)
              .filter(Bookmark.user_id == user_id).all())
    return [{"id": r.Bookmark.id, "user_id": r.Bookmark.user_id,
             "folder_id": r.Bookmark.folder_id, "recipe_id": r.Bookmark.recipe_id,
             "rating": r.Bookmark.rating, "folder_name": r.folder_name} for r in rows]

@app.delete("/api/folders/{folder_id}", status_code=204)
def delete_folder(folder_id: int, db: Session = Depends(get_test_db)):
    f = db.query(Folder).filter(Folder.id == folder_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Folder not found")
    db.delete(f)
    db.commit()

@app.delete("/api/bookmarks/{bookmark_id}", status_code=204)
def delete_bookmark(bookmark_id: int, db: Session = Depends(get_test_db)):
    b = db.query(Bookmark).filter(Bookmark.id == bookmark_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    db.delete(b)
    db.commit()

# ✅ Create tables ONCE when module loads
Base.metadata.create_all(bind=engine)

# ──────────────────────────────────────────────
# Fixtures
# ──────────────────────────────────────────────
@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture(autouse=True)
def reset_db():
    """✅ FIX: Clear data before each test (but DON'T drop tables)."""
    db = TestingSessionLocal()
    try:
        # Delete in reverse order of foreign keys
        db.query(Bookmark).delete(synchronize_session=False)
        db.query(Folder).delete(synchronize_session=False)
        db.query(User).delete(synchronize_session=False)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Reset error: {e}")
    finally:
        db.close()
    
    yield
    
    # Cleanup after test too
    db = TestingSessionLocal()
    try:
        db.query(Bookmark).delete(synchronize_session=False)
        db.query(Folder).delete(synchronize_session=False)
        db.query(User).delete(synchronize_session=False)
        db.commit()
    except:
        db.rollback()
    finally:
        db.close()

# ──────────────────────────────────────────────
# Integration Tests
# ──────────────────────────────────────────────

class TestSignupAndFolderCreation:
    """Integration: User signup → folder creation."""
    
    def test_user_can_signup_and_create_folder(self, client: TestClient):
        """User signs up and immediately creates a folder."""
        # Signup
        signup_res = client.post("/auth/signup", json={
            "username": "alice", "email": "alice@example.com", "password": "pw123"
        })
        assert signup_res.status_code == 201
        user_id = signup_res.json()["id"]
        
        # Create folder
        folder_res = client.post("/api/folders", json={
            "name": "My Recipes", "user_id": user_id
        })
        assert folder_res.status_code == 201
        assert folder_res.json()["name"] == "My Recipes"
        
        # Verify folder persisted
        folders_res = client.get(f"/api/folders?user_id={user_id}")
        assert len(folders_res.json()) == 1

class TestMultipleUsersIsolation:
    """Integration: Multiple users have isolated data."""
    
    def test_users_cannot_see_each_others_folders(self, client: TestClient):
        """User A can't see User B's folders."""
        # Create User A and folder
        user_a_res = client.post("/auth/signup", json={
            "username": "alice", "email": "alice@example.com", "password": "pw"
        })
        user_a_id = user_a_res.json()["id"]
        
        client.post("/api/folders", json={
            "name": "Alice's Recipes", "user_id": user_a_id
        })
        
        # Create User B and folder
        user_b_res = client.post("/auth/signup", json={
            "username": "bob", "email": "bob@example.com", "password": "pw"
        })
        user_b_id = user_b_res.json()["id"]
        
        client.post("/api/folders", json={
            "name": "Bob's Recipes", "user_id": user_b_id
        })
        
        # User A gets only their folders
        user_a_folders = client.get(f"/api/folders?user_id={user_a_id}").json()
        assert len(user_a_folders) == 1
        assert user_a_folders[0]["name"] == "Alice's Recipes"
        
        # User B gets only their folders
        user_b_folders = client.get(f"/api/folders?user_id={user_b_id}").json()
        assert len(user_b_folders) == 1
        assert user_b_folders[0]["name"] == "Bob's Recipes"

class TestBookmarkCreationPersistence:
    """Integration: Bookmark creation stores in database."""
    
    def test_bookmark_persists_to_database(self, client: TestClient):
        """Created bookmark is stored in database."""
        # Setup
        user_res = client.post("/auth/signup", json={
            "username": "chef", "email": "chef@example.com", "password": "pw"
        })
        user_id = user_res.json()["id"]
        
        folder_res = client.post("/api/folders", json={
            "name": "Favorites", "user_id": user_id
        })
        folder_id = folder_res.json()["id"]
        
        # Create bookmark
        bookmark_res = client.post("/api/bookmarks", json={
            "user_id": user_id, "folder_id": folder_id, "recipe_id": 42, "rating": 5
        })
        assert bookmark_res.status_code == 201
        
        # Verify in database
        db = TestingSessionLocal()
        try:
            db_bookmark = db.query(Bookmark).filter(Bookmark.recipe_id == 42).first()
            assert db_bookmark is not None
            assert db_bookmark.rating == 5
        finally:
            db.close()

class TestCascadingDelete:
    """Integration: Deleting folder cascades delete to bookmarks."""
    
    def test_delete_folder_removes_bookmarks(self, client: TestClient):
        """Bookmarks are deleted when folder is deleted."""
        # Setup
        user_res = client.post("/auth/signup", json={
            "username": "user", "email": "user@example.com", "password": "pw"
        })
        user_id = user_res.json()["id"]
        
        folder_res = client.post("/api/folders", json={
            "name": "Temp", "user_id": user_id
        })
        folder_id = folder_res.json()["id"]
        
        # Create bookmarks
        client.post("/api/bookmarks", json={
            "user_id": user_id, "folder_id": folder_id, "recipe_id": 1, "rating": 5
        })
        client.post("/api/bookmarks", json={
            "user_id": user_id, "folder_id": folder_id, "recipe_id": 2, "rating": 4
        })
        
        # Verify bookmarks exist
        bookmarks_before = client.get(f"/api/bookmarks/{user_id}").json()
        assert len(bookmarks_before) == 2
        
        # Delete folder
        client.delete(f"/api/folders/{folder_id}")
        
        # Verify bookmarks are gone
        bookmarks_after = client.get(f"/api/bookmarks/{user_id}").json()
        assert len(bookmarks_after) == 0

class TestBookmarkWrongUserFolder:
    """Integration: User can't use another user's folder for bookmark."""
    
    def test_cannot_bookmark_in_other_users_folder(self, client: TestClient):
        """User B can't bookmark in User A's folder."""
        # User A creates folder
        user_a_res = client.post("/auth/signup", json={
            "username": "alice", "email": "alice@example.com", "password": "pw"
        })
        user_a_id = user_a_res.json()["id"]
        
        folder_res = client.post("/api/folders", json={
            "name": "Alice's Secret", "user_id": user_a_id
        })
        folder_id = folder_res.json()["id"]
        
        # User B tries to bookmark in User A's folder
        user_b_res = client.post("/auth/signup", json={
            "username": "bob", "email": "bob@example.com", "password": "pw"
        })
        user_b_id = user_b_res.json()["id"]
        
        bookmark_res = client.post("/api/bookmarks", json={
            "user_id": user_b_id, "folder_id": folder_id, "recipe_id": 1, "rating": 3
        })
        
        # Should fail
        assert bookmark_res.status_code == 404

class TestBookmarkDuplicatePrevention:
    """Integration: Can't bookmark same recipe twice."""
    
    def test_cannot_bookmark_same_recipe_twice(self, client: TestClient):
        """Second bookmark of same recipe is rejected."""
        # Setup
        user_res = client.post("/auth/signup", json={
            "username": "user", "email": "user@example.com", "password": "pw"
        })
        user_id = user_res.json()["id"]
        
        folder_res = client.post("/api/folders", json={
            "name": "Folder", "user_id": user_id
        })
        folder_id = folder_res.json()["id"]
        
        # First bookmark
        res1 = client.post("/api/bookmarks", json={
            "user_id": user_id, "folder_id": folder_id, "recipe_id": 999, "rating": 5
        })
        assert res1.status_code == 201
        
        # Try second bookmark of same recipe
        res2 = client.post("/api/bookmarks", json={
            "user_id": user_id, "folder_id": folder_id, "recipe_id": 999, "rating": 4
        })
        assert res2.status_code == 400

class TestFolderBoundaries:
    """Integration: Test folder size and limits."""
    
    def test_folder_can_contain_multiple_bookmarks(self, client: TestClient):
        """One folder can have many bookmarks (different recipes)."""
        # Setup
        user_res = client.post("/auth/signup", json={
            "username": "user", "email": "user@example.com", "password": "pw"
        })
        user_id = user_res.json()["id"]
        
        folder_res = client.post("/api/folders", json={
            "name": "Folder", "user_id": user_id
        })
        folder_id = folder_res.json()["id"]
        
        # Add 10 bookmarks
        for i in range(1, 11):
            client.post("/api/bookmarks", json={
                "user_id": user_id, "folder_id": folder_id, "recipe_id": i, "rating": 5
            })
        
        # Verify all 10 persisted
        bookmarks = client.get(f"/api/bookmarks/{user_id}").json()
        assert len(bookmarks) == 10

class TestCompleteUserFlow:
    """Integration: Complete user workflow."""
    
    def test_signup_create_folder_and_bookmarks(self, client: TestClient):
        """Full workflow: signup → folders → bookmarks."""
        # 1. Signup
        user_res = client.post("/auth/signup", json={
            "username": "chef", "email": "chef@example.com", "password": "secret"
        })
        assert user_res.status_code == 201
        user_id = user_res.json()["id"]
        
        # 2. Create 2 folders
        folder1_res = client.post("/api/folders", json={
            "name": "Breakfast", "user_id": user_id
        })
        folder1_id = folder1_res.json()["id"]
        
        folder2_res = client.post("/api/folders", json={
            "name": "Dinner", "user_id": user_id
        })
        folder2_id = folder2_res.json()["id"]
        
        # 3. Add bookmarks to both folders
        for i in range(1, 4):
            client.post("/api/bookmarks", json={
                "user_id": user_id, "folder_id": folder1_id,
                "recipe_id": i, "rating": (i % 5) + 1
            })
        
        for i in range(4, 7):
            client.post("/api/bookmarks", json={
                "user_id": user_id, "folder_id": folder2_id,
                "recipe_id": i, "rating": (i % 5) + 1
            })
        
        # 4. Verify all bookmarks
        bookmarks = client.get(f"/api/bookmarks/{user_id}").json()
        assert len(bookmarks) == 6
        
        # 5. Verify all folders
        folders = client.get(f"/api/folders?user_id={user_id}").json()
        assert len(folders) == 2
        
        # 6. Delete one folder and verify cascade
        client.delete(f"/api/folders/{folder1_id}")
        remaining_bookmarks = client.get(f"/api/bookmarks/{user_id}").json()
        assert len(remaining_bookmarks) == 3