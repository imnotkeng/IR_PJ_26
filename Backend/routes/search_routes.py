from flask import Blueprint, request, jsonify
from elasticsearch import Elasticsearch

# 1. Create a Blueprint for search
search_bp = Blueprint('search_bp', __name__)

# 2. Setup Elasticsearch
es = Elasticsearch("http://localhost:9200") 
INDEX_NAME = "ir_recipes"

# 3. Change @app.route to @search_bp.route
@search_bp.route("/search", methods=["GET"])

def search():
    query = request.args.get("q", "")
    if not query:
        return jsonify({"error": "Query parameter 'q' is required"}), 400

    body = {
        "size": 12,
        "query": {
            "bool": {
                "must": [
                    {
                        "multi_match": {
                            "query": query,
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
            "text": query,
            "spell_suggest": {
                "phrase": {
                    "field": "Name_clean",
                    "size": 1,
                    "gram_size": 3,
                    "direct_generator": [{"field": "Name_clean", "suggest_mode": "always"}]
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
        if "suggest" in response and response["suggest"]["spell_suggest"][0]["options"]:
            for option in response["suggest"]["spell_suggest"][0]["options"]:
                suggestions.append(option["text"])

        max_score = response["hits"]["max_score"] or 1.0

        hits = []
        for i, hit in enumerate(response["hits"]["hits"]):
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

        
        return jsonify({
            "suggestion": suggestions[0] if suggestions else None,
            "results": hits
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500