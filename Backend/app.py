from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
 
# Import the ML service we just created
from ml_service import ml

from routes.search_routes import router as search_router
from routes.auth_routes import router as auth_router
from routes.folder_routes import router as folder_router
from routes.bookmark_routes import router as bookmark_router 
from routes.recommendation_routes import router as recommendation_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load models here
    ml.load_models()
    yield
    # Code here runs when the server shuts dow
    print("Shutting down server...")

# Add lifespan to the FastAPI app
app = FastAPI(lifespan=lifespan)
 
# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
# Routers
app.include_router(search_router)
app.include_router(auth_router)
app.include_router(folder_router)
app.include_router(bookmark_router) 
app.include_router(recommendation_router)

print("http://127.0.0.1:5001/docs#/")

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=5001, reload=True)