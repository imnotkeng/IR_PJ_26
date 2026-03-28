#%%
import os
import json
import pickle
import pandas as pd
from pathlib import Path
from elasticsearch import Elasticsearch
#%%
import re
import pandas as pd
from pathlib import Path
import pickle
from tqdm import tqdm  # don't forget to import tqdm!


# 1. Define required columns (as agreed)
SEARCH_COLS = ['Name', 'RecipeIngredientParts', 'RecipeInstructions']
TAG_COLS    = ['Keywords', 'RecipeCategory']
RAW_COLS    = ['RecipeId', 'Images', 'Description', 'RecipeIngredientQuantities',
               'AggregatedRating', 'ReviewCount', 'TotalTime', 'RecipeYield']
ALL_COLS    = SEARCH_COLS + TAG_COLS + RAW_COLS

def get_and_clean_data_for_es() -> pd.DataFrame:
    csv_path = 'resource/recipes_updated.csv'
    cache_path = Path('resource/cleaned_ready_for_es.pkl')

    if cache_path.exists():
        print("📥 Loading cleaned data from cache...")
        with open(cache_path, 'rb') as f:
            return pickle.load(f)

    print(f"📖 Loading data from {csv_path}...")
    df = pd.read_csv(csv_path, usecols=lambda c: c in ALL_COLS)
    df = df.dropna(subset=['Name', 'RecipeIngredientParts', 'RecipeInstructions'])
    df = df.drop_duplicates(subset=['RecipeId']).reset_index(drop=True)

    print("🧽 Sanitizing text for search (SEARCH_COLS)...")
    for col in tqdm(SEARCH_COLS, desc="Cleaning Search Text", unit="col"):
        df[col + '_clean'] = (
            df[col]
            .astype(str)
            .str.lower()
            .str.replace(r'[^a-z0-9\s]', ' ', regex=True)
            .str.replace(r'\s+', ' ', regex=True)
            .str.strip()
        )

    def clean_r_format_to_list(val):
        if pd.isna(val) or val == 'character(0)' or str(val).strip() == '':
            return []
        val_str = str(val).replace('\\u003C', '<').replace('\\"', '')
        items = re.findall(r'"([^"]+)"', val_str)
        return items if items else [val_str.strip()]

    # ✨ New function: convert time PT1H30M -> 90 minutes
    def parse_pt_time(pt_str):
        if pd.isna(pt_str) or not isinstance(pt_str, str):
            return "0 minutes"
        val = pt_str.replace("PT", "")
        h = re.search(r'(\d+)H', val)
        m = re.search(r'(\d+)M', val)
        hours = int(h.group(1)) if h else 0
        mins = int(m.group(1)) if m else 0
        total_mins = hours * 60 + mins
        return f"{total_mins} minutes"

    print("🧹 Cleaning R format and converting to arrays...")
    cols_to_list = ['RecipeIngredientQuantities', 'RecipeIngredientParts', 'Keywords']
    for col in tqdm(cols_to_list, desc="Converting to Lists", unit="col"):
        df[col] = df[col].apply(clean_r_format_to_list)

    # Convert time into readable format
    df['TotalTime'] = df['TotalTime'].apply(parse_pt_time)

    null_fill_map = {
        'Images': '', 'Description': '', 'RecipeCategory': 'Uncategorized',
        'AggregatedRating': 0.0, 'ReviewCount': 0
    }
    for col, fill_val in null_fill_map.items():
        df[col] = df[col].fillna(fill_val)

    print(f"\n💾 Saving cache to {cache_path}")
    with open(cache_path, 'wb') as f:
        pickle.dump(df, f)

    return df

    from elasticsearch import Elasticsearch

    es = Elasticsearch("https://localhost:9200")
    es.info().body

if __name__ == '__main__':
    # You can test run directly
    df_clean = get_and_clean_data_for_es()
    print("\nExample of cleaned data:")
    print(df_clean[['Name_clean', 'RecipeIngredientParts_clean']].head())

#%%
import pandas as pd
import pickle
from pathlib import Path
from elasticsearch import Elasticsearch, helpers
import numpy as np
from tqdm import tqdm

class CyosojvpIndexer:
    def __init__(self):
        self.data_path = Path('resource/cleaned_ready_for_es.pkl')
        print(f"📥 Loading data from {self.data_path} ...")
        with open(self.data_path, 'rb') as f:
            self.df = pickle.load(f)

        self.es_client = Elasticsearch(
            "https://localhost:9200",
        )
        self.index_name = 'IR_recipes'

    def create_index_with_mapping(self):
        self.es_client.options(ignore_status=[400, 404]).indices.delete(index=self.index_name)

        mapping = {
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 0,
                "analysis": {
                    "analyzer": {
                        "english_analyzer": {
                            "type": "english"
                        }
                    }
                }
            },
            "mappings": {
                "properties": {
                    "RecipeId": {"type": "keyword"},
                    "Name_clean": {
                        "type": "text",
                        "analyzer": "english_analyzer",
                        "fields": {
                            "keyword": {"type": "keyword"}  # added here
                        }
                    },
                    "RecipeIngredientParts_clean": {"type": "text", "analyzer": "english_analyzer"},
                    "RecipeInstructions_clean": {"type": "text", "analyzer": "english_analyzer"},
                    "RecipeCategory": {"type": "keyword"},
                    "Keywords": {"type": "text"},
                    "Images": {"type": "keyword", "index": False},
                    "Description": {"type": "text", "index": False},
                    "RecipeIngredientQuantities": {"type": "text", "index": False},
                    "AggregatedRating": {"type": "float"},
                    "ReviewCount": {"type": "integer"},
                    "TotalTime": {"type": "keyword"}
                }
            }
        }

        self.es_client.indices.create(index=self.index_name, body=mapping)
        print(f"✅ Index '{self.index_name}' created with analyzer settings!")

    def generate_actions(self):
        df_clean = self.df.replace({np.nan: None})
        records = df_clean.to_dict(orient='records')

        for row in tqdm(records, desc="⚡ Uploading to Elasticsearch", unit=" recipes", colour="green"):
            yield {
                "_index": self.index_name,
                "_id": str(row["RecipeId"]),
                "_source": row
            }

    def run_indexer(self):
        if not self.es_client.ping():
            print("❌ Cannot connect to Elasticsearch. Please check server and credentials")
            return

        print("🚀 Preparing to create index...")
        self.create_index_with_mapping()

        print(f"📦 Starting upload of {len(self.df):,} recipes...")

        success, failed = helpers.bulk(
            self.es_client,
            self.generate_actions(),
            chunk_size=2000,
            stats_only=True,
            raise_on_error=False
        )

        print(f"🎉 Done! Successfully indexed {success:,} items | Failed {failed} items")

if __name__ == "__main__":
    indexer = CyosojvpIndexer()
    indexer.run_indexer()


def search_recipes(query):
    if not query:
        return "Please provide a search query"

    body = {
        "size": 12,
        "query": {
            "multi_match": {
                "query": query,
                # 1. Apply field boosting here (correct placement)
                "fields": [
                    "Name_clean^5",
                    "RecipeIngredientParts_clean^2",
                    "RecipeInstructions_clean"
                ],
                "type": "cross_fields",
                "operator": "and"
            }
        },
        "suggest": {
            "text": query,
            "spell_suggest": {
                "phrase": {
                    "field": "Name_clean",
                    "size": 1,
                    "gram_size": 3,
                    "direct_generator": [
                        {
                            # 2. revert to original field
                            "field": "Name_clean",
                            "suggest_mode": "always"
                        }
                    ]
                }
            }
        },
        # 3. Bonus: add highlight system (Score 14)
        "highlight": {
            "fields": {
                "RecipeInstructions_clean": {
                    "pre_tags": ["**"],  # bold wrapper
                    "post_tags": ["**"],
                    "fragment_size": 100, # limit to 100 chars
                    "number_of_fragments": 1
                }
            }
        }
    }

    response = es.search(index=INDEX_NAME, body=body)

    suggestions = []
    if "suggest" in response and response["suggest"]["spell_suggest"][0]["options"]:
        for option in response["suggest"]["spell_suggest"][0]["options"]:
            suggestions.append(option["text"])

    if suggestions:
        print(f"💡 Did you mean: {', '.join(suggestions)} ?\n")

    max_score = response["hits"]["max_score"]
    if not max_score:
        max_score = 1.0

    print(f"🔍 Results for '{query}':")
    print("="*60)

    hits = []
    for i, hit in enumerate(response["hits"]["hits"]):
        item = hit["_source"]
        score = round((hit["_score"] / max_score), 4)
        rank = i + 1

        ingredients = item.get("RecipeIngredientParts", [])
        if isinstance(ingredients, list):
            ingredients_str = ", ".join(ingredients)
        else:
            ingredients_str = str(ingredients).replace(" ", ", ")

        # 4. extract highlight result
        snippet = ""
        if "highlight" in hit and "RecipeInstructions_clean" in hit["highlight"]:
            snippet = hit["highlight"]["RecipeInstructions_clean"][0]

        display_text = (
            f"Rank {rank} | Score: {score}\n"
            f"Recipe name: {item.get('Name', 'Unknown')}\n"
            f"Total time: {item.get('TotalTime', 'Unknown')}\n"
            f"Category: {item.get('RecipeCategory', 'Uncategorized')}\n"
            f"Ingredients: {ingredients_str}\n"
        )

        # show highlight if exists
        if snippet:
            display_text += f"Snippet: ...{snippet}...\n"

        display_text += "-"*60

        print(display_text)

        item["Score"] = score
        item["Rank"] = rank
        hits.append(item)

    return hits

#%%
results = search_recipes("spicy chicken")