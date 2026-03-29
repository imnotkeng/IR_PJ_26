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

            hits.append({
                "id": str(item.get("RecipeId")),
                "name": item.get("Name", "Unknown"),
                "minutes": item.get("TotalTime", 0),  
                "image_url": image_link,              
                "ingredients": ingredients_str,
                "steps": snippet
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