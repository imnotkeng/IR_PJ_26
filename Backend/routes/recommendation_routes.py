from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from elasticsearch import Elasticsearch
import scipy.sparse as sp
import numpy as np

from database import get_db
from models import Bookmark
from ml_service import ml

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])
es = Elasticsearch("http://localhost:9200")
INDEX_NAME = "ir_recipes"

@router.get("/folder/{folder_id}")
def get_folder_recommendations(folder_id: int, db: Session = Depends(get_db)):
    # 1. Get user's bookmarks from this folder
    bookmarks = db.query(Bookmark).filter(Bookmark.folder_id == folder_id).all()
    if not bookmarks:
        raise HTTPException(status_code=400, detail="Folder is empty. Cannot recommend.")

    # Load models
    model = ml.get_model()
    vectorizer = ml.get_vectorizer()
    
    # 2. Get recipe text for these bookmarks to build User Profile
    bookmark_texts = []
    for b in bookmarks:
        res = es.search(index=INDEX_NAME, body={"query": {"term": {"RecipeId": b.recipe_id}}})
        if res["hits"]["total"]["value"] > 0:
            item = res["hits"]["hits"][0]["_source"]
            
            # Combine text exactly like you did in training
            ingredients = " ".join(item.get("RecipeIngredientParts", []))
            keywords = " ".join(item.get("Keywords", []))
            name = item.get("Name", "")
            text = f"{ingredients} {keywords} {name}".lower()
            bookmark_texts.append(text)

    if not bookmark_texts:
        raise HTTPException(status_code=400, detail="Could not find recipe details.")

    # 3. Create User Profile Matrix (u_chunk)
    # Turn bookmarked texts into numbers and find the average
    bookmark_matrix = vectorizer.transform(bookmark_texts)
    user_profile_array = bookmark_matrix.mean(axis=0) 
    user_profile = sp.csr_matrix(user_profile_array) # Make it 1x3000 sparse matrix

    # Find the top 5 words this user likes (e.g., "chicken", "garlic")
    feature_names = vectorizer.get_feature_names_out()
    top_indices = user_profile_array.A[0].argsort()[-5:][::-1]
    top_words = [feature_names[i] for i in top_indices]
    search_query = " ".join(top_words)

    # 4. Ask Elasticsearch for 100 candidate recipes using those top words
    candidate_res = es.search(index=INDEX_NAME, body={
        "size": 100,
        "query": {
            "multi_match": {
                "query": search_query,
                "fields": ["RecipeIngredientParts", "Keywords", "Name"]
            }
        }
    })
    
    candidates = []
    candidate_texts = []
    candidate_numerics = []

    for hit in candidate_res["hits"]["hits"]:
        item = hit["_source"]
        candidates.append(item)
        
        # Prepare text for r_chunk
        ingredients = " ".join(item.get("RecipeIngredientParts", []))
        keywords = " ".join(item.get("Keywords", []))
        name = item.get("Name", "")
        text = f"{ingredients} {keywords} {name}".lower()
        candidate_texts.append(text)
        
        # Prepare numbers for n_chunk (AggregatedRating, ReviewCount)
        agg_rating = float(item.get("AggregatedRating", 0) or 0)
        rev_count = np.log1p(float(item.get("ReviewCount", 0) or 0))
        candidate_numerics.append([agg_rating, rev_count])

    # 5. Prepare data for LightGBM exactly like training
    r_chunk = vectorizer.transform(candidate_texts) # 100 x 3000 matrix
    u_chunk = sp.vstack([user_profile] * len(candidates)) # Duplicate user profile 100 times
    i_chunk = r_chunk.multiply(u_chunk) # Interaction matrix
    n_chunk = sp.csr_matrix(candidate_numerics, dtype=np.float32) # Numeric matrix
    
    # Combine all features: [r, u, i, n]
    X_predict = sp.hstack([r_chunk, u_chunk, i_chunk, n_chunk], format='csr', dtype=np.float32)

    # 6. Predict Scores with LightGBM
    scores = model.predict(X_predict)

    # 7. Sort and Return Top 10
    for i in range(len(candidates)):
        candidates[i]["ml_score"] = float(scores[i])
        
    # Sort by highest score first
    candidates = sorted(candidates, key=lambda x: x["ml_score"], reverse=True)
    top_10 = candidates[:10]

    # Format the results for your frontend
    results = []
    for item in top_10:
        images = item.get("Images", [])
        
        # NEW LOGIC: Check if it's a list OR a string
        if isinstance(images, list) and len(images) > 0:
            image_link = images[0]
        elif isinstance(images, str) and images.strip() != "":
            image_link = images
        else:
            image_link = "https://placehold.co/600x400?text=No+Image"
            
        results.append({
            "id": str(item.get("RecipeId")),
            "name": item.get("Name", "Unknown"),
            "image_url": image_link,
            "prediction_score": round(item["ml_score"], 4)
        })

    return results

@router.get("/random")
def get_random_recommendations():
    """UC-007: Return a set of completely random dishes."""
    # Use Elasticsearch function_score with random_score
    body = {
        "size": 10,
        "query": {
            "function_score": {
                "query": {"match_all": {}},
                "random_score": {}
            }
        }
    }
    
    res = es.search(index=INDEX_NAME, body=body)
    results = []
    
    for hit in res["hits"]["hits"]:
        item = hit["_source"]
        images = item.get("Images", [])
        
        if isinstance(images, list) and len(images) > 0:
            image_link = images[0]
        elif isinstance(images, str) and images.strip() != "":
            image_link = images
        else:
            image_link = "https://placehold.co/600x400?text=No+Image"
            
        results.append({
            "id": str(item.get("RecipeId")),
            "name": item.get("Name", "Unknown"),
            "image_url": image_link
        })
        
    return results


@router.get("/home/{user_id}")
def get_home_recommendations(user_id: int, db: Session = Depends(get_db)):
    """UC-007: Return summary list and specific category list."""
    # 1. Get all bookmarks for the user
    all_bookmarks = db.query(Bookmark).filter(Bookmark.user_id == user_id).all()
    
    if not all_bookmarks:
        return {"summary_list": [], "category_list": [], "category_name": ""}

    # --- LIST 1: SUMMARY FROM ALL FOLDERS ---
    # To keep it fast, we just grab the 10 most recent bookmarks and pretend they are the ML result
    # (If you want full ML here, you can reuse the code from the folder route)
    summary_list = []
    recent_bookmarks = all_bookmarks[-10:] 
    for b in recent_bookmarks:
        res = es.search(index=INDEX_NAME, body={"query": {"term": {"RecipeId": b.recipe_id}}})
        if res["hits"]["total"]["value"] > 0:
            item = res["hits"]["hits"][0]["_source"]
            images = item.get("Images", [])
            image_link = images[0] if (isinstance(images, list) and len(images) > 0) else "https://placehold.co/600x400"
            if isinstance(images, str) and images.strip() != "": image_link = images

            summary_list.append({
                "id": str(item.get("RecipeId")),
                "name": item.get("Name", "Unknown"),
                "image_url": image_link,
                "prediction_score": 0.95 # Mock high score
            })

    # --- LIST 2: SPECIFIC CATEGORY ---
    # Pick a random folder the user has
    folders = list(set([b.folder_id for b in all_bookmarks]))
    chosen_folder_id = random.choice(folders)
    
    # Get the folder name
    from models import Folder
    folder_db = db.query(Folder).filter(Folder.id == chosen_folder_id).first()
    folder_name = folder_db.name if folder_db else "Saved Recipes"

    # For now, return the items in that folder (You can call your ML function here if you want predictions)
    category_list = []
    folder_bookmarks = [b for b in all_bookmarks if b.folder_id == chosen_folder_id][:10]
    for b in folder_bookmarks:
        res = es.search(index=INDEX_NAME, body={"query": {"term": {"RecipeId": b.recipe_id}}})
        if res["hits"]["total"]["value"] > 0:
            item = res["hits"]["hits"][0]["_source"]
            images = item.get("Images", [])
            image_link = images[0] if (isinstance(images, list) and len(images) > 0) else "https://placehold.co/600x400"
            if isinstance(images, str) and images.strip() != "": image_link = images

            category_list.append({
                "id": str(item.get("RecipeId")),
                "name": item.get("Name", "Unknown"),
                "image_url": image_link,
                "prediction_score": 0.88 # Mock high score
            })

    return {
        "summary_list": summary_list,
        "category_list": category_list,
        "category_name": folder_name
    }