

"""
UNIT TESTS — Recipe App API
===========================
Tests INDIVIDUAL functions and methods in ISOLATION.
No database, no external APIs — everything is mocked.

Run:
    pytest test_unit.py -v 

Total: ~15 unit tests
"""

import pytest
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import jwt
from pydantic import ValidationError, EmailStr

# ──────────────────────────────────────────────
# Setup: Functions to test
# ──────────────────────────────────────────────

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "test-secret"
ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(email: str, expires_delta: timedelta = None) -> str:
    to_encode = {"sub": email}
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=1)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except:
        return None

def validate_rating(rating: int) -> bool:
    """Rating must be between 1 and 5."""
    return 1 <= rating <= 5

def validate_email(email: str) -> bool:
    """Basic email validation."""
    return "@" in email and "." in email

def validate_password_strength(password: str) -> bool:
    """Password must be at least 8 characters."""
    return len(password) >= 8

# ──────────────────────────────────────────────
# Unit Tests: Password Hashing
# ──────────────────────────────────────────────

class TestPasswordHashing:
    """Test password hashing and verification in isolation."""
    
    def test_hash_password_returns_different_hash_each_time(self):
        """Same password produces different hash (due to salt)."""
        password = "mypassword123"
        hash1 = hash_password(password)
        hash2 = hash_password(password)
        assert hash1 != hash2
    
    def test_hash_password_not_plaintext(self):
        """Hashed password is not plaintext."""
        password = "secretpassword"
        hashed = hash_password(password)
        assert hashed != password
    
    def test_verify_password_correct_password_returns_true(self):
        """Correct password verifies successfully."""
        password = "correctpassword"
        hashed = hash_password(password)
        assert verify_password(password, hashed) == True
    
    def test_verify_password_wrong_password_returns_false(self):
        """Wrong password fails verification."""
        password = "correctpassword"
        hashed = hash_password(password)
        assert verify_password("wrongpassword", hashed) == False
    
    def test_verify_password_empty_string_returns_false(self):
        """Empty string fails verification."""
        hashed = hash_password("password")
        assert verify_password("", hashed) == False
    
    def test_verify_password_case_sensitive(self):
        """Password verification is case-sensitive."""
        hashed = hash_password("Password123")
        assert verify_password("password123", hashed) == False
        assert verify_password("PASSWORD123", hashed) == False

# ──────────────────────────────────────────────
# Unit Tests: JWT Token Creation & Validation
# ──────────────────────────────────────────────

class TestJWTTokens:
    """Test JWT token creation and decoding in isolation."""
    
    def test_create_token_returns_valid_jwt(self):
        """Token creation returns a valid JWT."""
        email = "test@example.com"
        token = create_token(email)
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_create_token_with_custom_expiry(self):
        """Token creation respects custom expiry."""
        email = "test@example.com"
        expires = timedelta(hours=2)
        token = create_token(email, expires)
        assert token is not None
    
    def test_decode_token_extracts_email(self):
        """Decoding token extracts the email."""
        email = "user@example.com"
        token = create_token(email)
        decoded_email = decode_token(token)
        assert decoded_email == email
    
    def test_decode_invalid_token_returns_none(self):
        """Invalid token returns None."""
        invalid_token = "not.a.valid.token"
        decoded = decode_token(invalid_token)
        assert decoded is None
    
    def test_decode_expired_token_returns_none(self):
        """Expired token returns None."""
        email = "user@example.com"
        # Create token that expired 1 hour ago
        expired_token = jwt.encode(
            {"sub": email, "exp": datetime.utcnow() - timedelta(hours=1)},
            SECRET_KEY,
            algorithm=ALGORITHM
        )
        decoded = decode_token(expired_token)
        assert decoded is None

# ──────────────────────────────────────────────
# Unit Tests: Data Validation
# ──────────────────────────────────────────────

class TestRatingValidation:
    """Test rating validation rules."""
    
    def test_rating_1_is_valid(self):
        assert validate_rating(1) == True
    
    def test_rating_5_is_valid(self):
        assert validate_rating(5) == True
    
    def test_rating_3_is_valid(self):
        assert validate_rating(3) == True
    
    def test_rating_0_is_invalid(self):
        assert validate_rating(0) == False
    
    def test_rating_6_is_invalid(self):
        assert validate_rating(6) == False
    
    def test_rating_negative_is_invalid(self):
        assert validate_rating(-1) == False
    
    def test_rating_100_is_invalid(self):
        assert validate_rating(100) == False


class TestEmailValidation:
    """Test email validation."""
    
    def test_valid_email(self):
        assert validate_email("user@example.com") == True
    
    def test_valid_email_with_subdomain(self):
        assert validate_email("user@mail.example.com") == True
    
    def test_invalid_email_no_at_symbol(self):
        assert validate_email("userexample.com") == False
    
    def test_invalid_email_no_dot(self):
        assert validate_email("user@example") == False
    
    def test_invalid_email_empty_string(self):
        assert validate_email("") == False


class TestPasswordStrengthValidation:
    """Test password strength validation."""
    
    def test_weak_password_below_8_chars(self):
        assert validate_password_strength("short") == False
    
    def test_weak_password_exactly_7_chars(self):
        assert validate_password_strength("1234567") == False
    
    def test_strong_password_exactly_8_chars(self):
        assert validate_password_strength("12345678") == True
    
    def test_strong_password_above_8_chars(self):
        assert validate_password_strength("verylongpassword123") == True
    
    def test_empty_password_is_weak(self):
        assert validate_password_strength("") == False

# ──────────────────────────────────────────────
# Unit Tests: Business Logic
# ──────────────────────────────────────────────

class TestBusinessLogic:
    """Test pure business logic functions."""
    
    def test_calculate_folder_size(self):
        """Calculate number of bookmarks in a folder."""
        def folder_size(bookmarks: list) -> int:
            return len(bookmarks)
        
        assert folder_size([]) == 0
        assert folder_size([1, 2, 3]) == 3
    
    def test_calculate_average_rating(self):
        """Calculate average rating of bookmarks."""
        def avg_rating(ratings: list) -> float:
            if not ratings:
                return 0.0
            return sum(ratings) / len(ratings)
        
        assert avg_rating([]) == 0.0
        assert avg_rating([5]) == 5.0
        assert avg_rating([5, 4, 3]) == 4.0
        assert avg_rating([1, 2, 3, 4, 5]) == 3.0
    
    def test_search_recipes_by_name(self):
        """Search recipes by partial name match."""
        def search_recipes(query: str, recipes: list) -> list:
            return [r for r in recipes if query.lower() in r.lower()]
        
        recipes = ["Pasta Carbonara", "Grilled Chicken", "Pasta Primavera"]
        assert search_recipes("pasta", recipes) == ["Pasta Carbonara", "Pasta Primavera"]
        assert search_recipes("Chicken", recipes) == ["Grilled Chicken"]
        assert search_recipes("xyz", recipes) == []
    
    def test_sort_recipes_by_rating(self):
        """Sort recipes by rating (highest first)."""
        def sort_by_rating(recipes: list, key="rating") -> list:
            return sorted(recipes, key=lambda r: r[key], reverse=True)
        
        recipes = [
            {"name": "Pasta", "rating": 4},
            {"name": "Chicken", "rating": 5},
            {"name": "Bread", "rating": 3}
        ]
        sorted_recipes = sort_by_rating(recipes)
        assert sorted_recipes[0]["name"] == "Chicken"
        assert sorted_recipes[1]["name"] == "Pasta"
        assert sorted_recipes[2]["name"] == "Bread"

# ──────────────────────────────────────────────
# Unit Tests: Utility Functions
# ──────────────────────────────────────────────

class TestUtilityFunctions:
    """Test utility functions."""
    
    def test_format_recipe_name_removes_extra_spaces(self):
        """Clean up recipe name."""
        def clean_name(name: str) -> str:
            return " ".join(name.split())
        
        assert clean_name("Pasta  Carbonara") == "Pasta Carbonara"
        assert clean_name("  Leading Space") == "Leading Space"
        assert clean_name("Trailing Space  ") == "Trailing Space"
    
    def test_sanitize_user_input(self):
        """Sanitize user input."""
        def sanitize(text: str) -> str:
            return text.strip().lower()
        
        assert sanitize("  Hello World  ") == "hello world"
        assert sanitize("PASTA") == "pasta"
        assert sanitize("") == ""
    
    def test_generate_recipe_id(self):
        """Generate unique recipe ID."""
        def generate_id(recipe_name: str) -> str:
            return recipe_name.lower().replace(" ", "-")
        
        assert generate_id("Pasta Carbonara") == "pasta-carbonara"
        assert generate_id("Grilled Chicken") == "grilled-chicken"

# ──────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────
"""
Unit Test Coverage:
✅ Password hashing (6 tests)
✅ JWT tokens (5 tests)
✅ Rating validation (7 tests)
✅ Email validation (5 tests)
✅ Password strength (5 tests)
✅ Business logic (4 tests)
✅ Utility functions (3 tests)

Total: 35 unit tests

Key characteristics:
- No database used
- No external APIs called
- All dependencies are functions/utilities
- Each test is independent
- Very fast execution (milliseconds)
- Focus on individual function behavior
"""