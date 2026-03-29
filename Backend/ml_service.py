import joblib
import os
import scipy.sparse as sp

class MLService:
    def __init__(self):
        self.model = None
        self.vectorizer = None
        self.recipe_id_to_idx = None

    def load_models(self):
        print("Loading ML models... This might take a few seconds.")
        
        # Get the current folder path
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Load the files
        self.model = joblib.load(os.path.join(base_dir, "model.pkl"))
        self.vectorizer = joblib.load(os.path.join(base_dir, "tfidf_vectorizer.pkl"))
        
        # Load the ID mapper so you know which recipe is which
        mapper_path = os.path.join(base_dir, "recipe_id_to_idx.pkl")
        if os.path.exists(mapper_path):
            self.recipe_id_to_idx = joblib.load(mapper_path)

        print("ML models loaded successfully!")

    def get_model(self):
        return self.model

    def get_vectorizer(self):
        return self.vectorizer

# Create a single global instance
ml = MLService()