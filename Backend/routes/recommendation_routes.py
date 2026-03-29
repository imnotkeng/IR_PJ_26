from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from elasticsearch import Elasticsearch
import scipy.sparse as sp
import numpy as np
import random

from database import get_db
from models import Bookmark, Folder
from ml_service import ml

import re

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])
es = Elasticsearch("http://localhost:9200")
INDEX_NAME = "ir_recipes"

# ==========================================
# 🧠 HELPER FUNCTION: The ML Engine
# ==========================================
def generate_ml_recommendations(bookmarks, limit=10):
    """Takes a list of bookmarks, builds a profile, and returns ML predictions."""
    if not bookmarks:
        return []

    model = ml.get_model()
    vectorizer = ml.get_vectorizer()

    from collections import defaultdict, Counter
    folder_groups = defaultdict(list)
    for b in bookmarks:
        folder_groups[b.folder_id].append(b)

    balanced_bookmarks = []
    for folder_id, items in folder_groups.items():
        balanced_bookmarks.extend(random.sample(items, min(3, len(items))))
    
    total_analyzed = len(balanced_bookmarks)
    
    bookmark_texts = []
    user_keyword_counts = Counter()
    user_ingredient_counts = Counter()

    # ⭐ NEW HELPER: Safely extracts real words whether ES sends a String or a List
    def extract_words(raw_data):
        if isinstance(raw_data, list):
            return [str(x) for x in raw_data]
        if isinstance(raw_data, str):
            # If it looks like R format c("Apple", "Banana") or "Apple", "Banana"
            quotes = re.findall(r'"([^"]+)"', raw_data)
            if quotes:
                return quotes
            # Otherwise just split by comma or space
            parts = raw_data.replace('c(', '').replace(')', '').split(',')
            return [p.strip() for p in parts]
        return []

    for b in balanced_bookmarks:
        res = es.search(index=INDEX_NAME, body={"query": {"term": {"RecipeId": b.recipe_id}}})
        if res["hits"]["total"]["value"] > 0:
            item = res["hits"]["hits"][0]["_source"]
            
            # Use the helper to ensure we get lists of WORDS, not letters
            ing_list = extract_words(item.get("RecipeIngredientParts", []))
            kw_list = extract_words(item.get("Keywords", []))
            
            ingredients = " ".join(ing_list)
            keywords = " ".join(kw_list)
            name = item.get("Name", "")
            bookmark_texts.append(f"{ingredients} {keywords} {name}".lower())
            
            # Count frequencies, but ignore single letters and weird symbols
            for i in ing_list:
                clean_i = i.lower().strip(' "(),')
                if len(clean_i) > 2: # 👈 Forces it to be a real word, not "e" or '"'
                    user_ingredient_counts[clean_i] += 1
                    
            for k in kw_list:
                clean_k = k.lower().strip(' "(),')
                if len(clean_k) > 2: # 👈 Forces it to be a real word
                    user_keyword_counts[clean_k] += 1

    if not bookmark_texts:
        return []

    # 2. Create User Profile Matrix
    bookmark_matrix = vectorizer.transform(bookmark_texts)
    user_profile_array = bookmark_matrix.mean(axis=0)
    user_profile = sp.csr_matrix(user_profile_array)

    # 3. Find the top words
    feature_names = vectorizer.get_feature_names_out()
    top_indices = user_profile_array.A[0].argsort()[-5:][::-1]
    top_words = [feature_names[i] for i in top_indices]
    search_query = " ".join(top_words)

    # 4. Ask Elasticsearch for 50 candidate recipes
    candidate_res = es.search(index=INDEX_NAME, body={
        "size": 50,
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
        if any(str(b.recipe_id) == str(item.get("RecipeId")) for b in bookmarks):
            continue

        candidates.append(item)
        
        # Use our helper again to safely read candidates
        ing_list = extract_words(item.get("RecipeIngredientParts", []))
        kw_list = extract_words(item.get("Keywords", []))
        
        ingredients = " ".join(ing_list)
        keywords = " ".join(kw_list)
        name = item.get("Name", "")
        candidate_texts.append(f"{ingredients} {keywords} {name}".lower())
        
        agg_rating = float(item.get("AggregatedRating", 0) or 0)
        rev_count = np.log1p(float(item.get("ReviewCount", 0) or 0))
        candidate_numerics.append([agg_rating, rev_count])

    if not candidates:
        return []

    # 5. Prepare data for LightGBM
    r_chunk = vectorizer.transform(candidate_texts)
    u_chunk = sp.vstack([user_profile] * len(candidates))
    i_chunk = r_chunk.multiply(u_chunk)
    n_chunk = sp.csr_matrix(candidate_numerics, dtype=np.float32)
    
    X_predict = sp.hstack([r_chunk, u_chunk, i_chunk, n_chunk], format='csr', dtype=np.float32)

    # 6. Predict Scores
    scores = model.predict(X_predict)

    for i in range(len(candidates)):
        candidates[i]["ml_score"] = float(scores[i])
        
    # 7. Sort and Format
    candidates = sorted(candidates, key=lambda x: x["ml_score"], reverse=True)
    top_results = candidates[:limit]

    results = []
    for item in top_results:
        images = item.get("Images", [])
        if isinstance(images, list) and len(images) > 0:
            image_link = images[0]
        elif isinstance(images, str) and images.strip() != "":
            image_link = images
        else:
            image_link = "https://placehold.co/600x400?text=No+Image"
            
        reasons = []
        
        rating = float(item.get("AggregatedRating", 0) or 0)
        if rating >= 4.0:
            reasons.append(f"Users like you gave this {rating}⭐ average.")
            
        # Reason B: Keywords safely checked
        recipe_keywords = [k.lower().strip(' "(),') for k in extract_words(item.get("Keywords", []))]
        shared_keywords = [k for k in recipe_keywords if k in user_keyword_counts and len(k) > 2]
        
        if shared_keywords:
            top_kw = max(shared_keywords, key=lambda k: user_keyword_counts[k])
            kw_count = user_keyword_counts[top_kw]
            reasons.append(f"You bookmarked {kw_count} other '{top_kw.title()}' dishes.")
            
        # Reason C: Ingredients safely checked
        recipe_ingredients = [i.lower().strip(' "(),') for i in extract_words(item.get("RecipeIngredientParts", []))]
        shared_ingredients = [i for i in recipe_ingredients if i in user_ingredient_counts and len(i) > 2]
        
        if shared_ingredients:
            top_ing = max(shared_ingredients, key=lambda i: user_ingredient_counts[i])
            ing_count = user_ingredient_counts[top_ing]
            
            percentage = int((ing_count / total_analyzed) * 100) if total_analyzed > 0 else 0
            
            if percentage > 20:
                reasons.append(f"You like {top_ing.title()} ({percentage}% of your saved recipes).")
            else:
                reasons.append(f"Contains {top_ing.title()}, an ingredient you cook with.")
            
        if len(reasons) == 0:
            reasons.append("Matches your overall taste profile.")

        final_reasons = reasons[:3]
            
        results.append({
            "id": str(item.get("RecipeId")),
            "name": item.get("Name", "Unknown"),
            "image_url": image_link,
            "prediction_score": round(item["ml_score"], 4),
            "reasons": final_reasons 
        })

    return results

# ==========================================
# 🚀 API ROUTES
# ==========================================

@router.get("/folder/{folder_id}")
def get_folder_recommendations(folder_id: int, db: Session = Depends(get_db)):
    """Generates recommendations based ONLY on a specific folder."""
    bookmarks = db.query(Bookmark).filter(Bookmark.folder_id == folder_id).all()
    if not bookmarks:
        raise HTTPException(status_code=400, detail="Folder is empty. Cannot recommend.")
    
    return generate_ml_recommendations(bookmarks)

@router.get("/random")
def get_random_recommendations():
    """UC-007: Return a set of completely random dishes."""
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
    """UC-007: Return ML summary list and ML specific category list."""
    all_bookmarks = db.query(Bookmark).filter(Bookmark.user_id == user_id).all()
    
    if not all_bookmarks:
        return {"summary_list": [], "category_list": [], "category_name": ""}

    # --- LIST 1: ML SUMMARY FROM ALL FOLDERS ---
    # We pass ALL the user's bookmarks to the ML engine
    summary_list = generate_ml_recommendations(all_bookmarks)

    # --- LIST 2: ML SPECIFIC CATEGORY ---
    # Pick a random folder, and pass ONLY that folder's bookmarks to the ML engine
    folders = list(set([b.folder_id for b in all_bookmarks]))
    chosen_folder_id = random.choice(folders)
    
    folder_db = db.query(Folder).filter(Folder.id == chosen_folder_id).first()
    folder_name = folder_db.name if folder_db else "Saved Recipes"

    folder_bookmarks = [b for b in all_bookmarks if b.folder_id == chosen_folder_id]
    category_list = generate_ml_recommendations(folder_bookmarks)

    return {
        "summary_list": summary_list,
        "category_list": category_list,
        "category_name": folder_name
    }