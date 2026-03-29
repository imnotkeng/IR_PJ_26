from fastapi import APIRouter, HTTPException, Query
from elasticsearch import Elasticsearch

# 1. Create a Router for search
router = APIRouter()

# 2. Setup Elasticsearch
es = Elasticsearch("http://localhost:9200") 
INDEX_NAME = "ir_recipes"

# ==========================================
# 3. EXISTING SEARCH ROUTE (Search Multiple)
# ==========================================
@router.get("/search")
def search(q: str = Query(None, description="Search query")):
    if not q:
        raise HTTPException(status_code=400, detail="Query parameter 'q' is required")

    body = {
        "size": 12,
        "query": {
            "bool": {
                "must": [
                    {
                        "multi_match": {
                            "query": q,
                            "fields": [
                                "Name_clean^5",
                                "RecipeIngredientParts_clean^2",
                                "RecipeInstructions_clean"
                            ],
                            "type": "best_fields",
                            "tie_breaker": 0.3,
                            "operator": "and"
                        }
                    }
                ]
            }
        },
        "suggest": {
            "text": q,
            "term_suggest": {
                "term": {
                    "field": "Name_clean",
                    "suggest_mode": "popular",   
                    "min_word_length": 3,        
                    "prefix_length": 1,          
                    "max_edits": 2,              
                    "string_distance": "internal"  
                }
            }
        },
        "highlight": {
            "fields": {
                "Name_clean": {},
                "RecipeInstructions_clean": {
                    "pre_tags": ["<mark>"],
                    "post_tags": ["</mark>"],
                    "fragment_size": 120,
                    "number_of_fragments": 1
                }
            }
        }
    }

    try:
        response = es.search(index=INDEX_NAME, body=body)
        max_score = response["hits"].get("max_score") or 1.0
        suggestions = []
        if "suggest" in response:
            term_opts = response["suggest"].get("term_suggest", [])
            corrected_words = []
            original_words = q.split()
                
            for i, token in enumerate(term_opts):
                if token["options"]:
                    corrected_words.append(token["options"][0]["text"])
                else:
                    corrected_words.append(original_words[i] if i < len(original_words) else "")
                
            corrected = " ".join(corrected_words)
            if corrected.lower() != q.lower():
                suggestions.append(corrected)

        hits = []
        for hit in response["hits"]["hits"]:
            item = hit["_source"]

            raw_score = hit.get("_score") or 0.0
            score = round(raw_score / max_score, 4)
                          
            snippet = ""
            if "highlight" in hit and "RecipeInstructions_clean" in hit["highlight"]:
                snippet = hit["highlight"]["RecipeInstructions_clean"][0]

            ingredients = item.get("RecipeIngredientParts", [])
            ingredients_str = ", ".join(ingredients) if isinstance(ingredients, list) else str(ingredients)

            images = item.get("Images", [])
            if isinstance(images, list) and len(images) > 0:
                image_link = images[0]
            elif isinstance(images, str) and images.strip() != "":
                image_link = images
            else:
                image_link = "https://placehold.co/600x400?text=No+Image+Available"

            total_time = item.get("TotalTime", "Unknown")
            
            hits.append({
                "id": str(item.get("RecipeId")),
                "name": item.get("Name", "Unknown"),
                "minutes": total_time,
                "image_url": image_link,
                "ingredients": ingredients_str,
                "steps": snippet if snippet else str(item.get("RecipeInstructions_clean", 
                                         item.get("RecipeInstructions", 
                                         "Instructions not available."))),
                "score": score,
})

        return {
            "suggestion": suggestions[0] if suggestions else None,
            "results": hits
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# 4. NEW ROUTE (Get Single Recipe by ID)
# ==========================================
@router.get("/api/recipes/{recipe_id}")
def get_recipe_by_id(recipe_id: int):
    """Fetch a single recipe by its RecipeId from Elasticsearch."""
    try:
        # Search Elasticsearch for an exact match on RecipeId
        body = {
            "query": {
                "term": {
                    "RecipeId": recipe_id
                }
            }
        }
        
        response = es.search(index=INDEX_NAME, body=body)
        
        if response["hits"]["total"]["value"] == 0:
            raise HTTPException(status_code=404, detail="Recipe not found")
            
        item = response["hits"]["hits"][0]["_source"]
        
        # Format the ingredients nicely
        ingredients = item.get("RecipeIngredientParts", [])
        ingredients_str = ", ".join(ingredients) if isinstance(ingredients, list) else str(ingredients)

        # Grab the first image if available
        images = item.get("Images", [])
        if isinstance(images, list) and len(images) > 0:
            image_link = images[0]
        elif isinstance(images, str) and images.strip() != "":
            image_link = images
        else:
            image_link = "https://placehold.co/600x400?text=No+Image+Available"

        # Return the exact format your frontend 'Recipe' interface expects
        return {
            "id": str(item.get("RecipeId")),
            "name": item.get("Name", "Unknown"),
            "minutes": item.get("TotalTime", 0),  
            "image_url": image_link,              
            "ingredients": ingredients_str,
            "steps": str(item.get("RecipeInstructions", "Instructions not available."))
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/api/suggest")
def get_fast_suggestion(q: str = Query(..., description="Query to spell check")):
    """Fast endpoint for real-time typing suggestions"""
    if not q or len(q.strip()) < 3:
        return {"suggestion": None}

    body = {
        "_source": False, # Don't return any recipe data!
        "suggest": {
            "text": q,
            "term_suggest": {
                "term": {
                    "field": "Name_clean",
                    "suggest_mode": "popular",   
                    "min_word_length": 3,        
                    "prefix_length": 1,          
                    "max_edits": 2,              
                    "string_distance": "internal"  
                }
            }
        }
    }

    try:
        response = es.search(index=INDEX_NAME, body=body)
        
        if "suggest" in response:
            term_opts = response["suggest"].get("term_suggest", [])
            corrected_words = []
            original_words = q.split()
                
            for i, token in enumerate(term_opts):
                if token["options"]:
                    corrected_words.append(token["options"][0]["text"])
                else:
                    corrected_words.append(original_words[i] if i < len(original_words) else "")
                
            corrected = " ".join(corrected_words)
            if corrected.lower() != q.lower():
                return {"suggestion": corrected}

        return {"suggestion": None}
    except Exception as e:
        return {"suggestion": None}
    
@router.get("/api/recipes/{recipe_id}/similar")
def get_similar_recipes(recipe_id: int):
    """IR Feature: Returns recipes that are similar to the given recipe_id using TF-IDF / BM25"""
    try:
        # 1.Find ES Internal _id 
        doc_res = es.search(index=INDEX_NAME, body={"query": {"term": {"RecipeId": recipe_id}}})
        
        if doc_res["hits"]["total"]["value"] == 0:
            return []
            
        es_internal_id = doc_res["hits"]["hits"][0]["_id"]

        # 2. more_like_this command
        body = {
            "size": 4, # เอาแค่ 4 เมนูพอให้ UI สวยงาม
            "query": {
                "more_like_this": {
                    "fields": ["RecipeIngredientParts", "Keywords", "Name_clean"], # เทียบความคล้ายจากส่วนผสมและชื่อ
                    "like": [
                        {"_index": INDEX_NAME, "_id": es_internal_id}
                    ],
                    "min_term_freq": 1,
                    "min_doc_freq": 1
                }
            }
        }
        
        response = es.search(index=INDEX_NAME, body=body)
        
        similar_recipes = []
        for hit in response["hits"]["hits"]:
            item = hit["_source"]
            
            
            images = item.get("Images", [])
            if isinstance(images, list) and len(images) > 0:
                image_link = images[0]
            elif isinstance(images, str) and images.strip() != "":
                image_link = images
            else:
                image_link = "https://placehold.co/600x400?text=No+Image"
                
            similar_recipes.append({
                "id": str(item.get("RecipeId")),
                "name": item.get("Name", "Unknown"),
                "image_url": image_link,
                "minutes": item.get("TotalTime", 0)
            })
            
        return similar_recipes
        
    except Exception as e:
        print("MLT Error:", e)
        return []