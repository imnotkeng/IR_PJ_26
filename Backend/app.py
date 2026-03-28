from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
 
from routes.search_routes import router as search_router
from routes.auth_routes import router as auth_router   # ← NEW
 
app = FastAPI()
 
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
app.include_router(auth_router)   # ← NEW  (prefix="/auth" is set inside auth_routes.py)
print("http://127.0.0.1:5001/docs#/")
if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=5001, reload=True)
 