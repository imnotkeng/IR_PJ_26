export interface Recipe {
  id: string;
  name: string;
  ingredients: string;
  steps: string;
  image_url: string;
  minutes: number;
  score: number;
  reasons?: string[];
}

export interface SearchResponse {
  results: Recipe[];
  suggestion: string | null; // For spell correction
}

export interface Recommendation {
  id: string;
  name: string;
  image_url: string;
  prediction_score: number;
  reasons?: string[];
}

export interface Bookmark{
  id: number;
  user_id: number;
  folder_id: number;
  recipe_id: number | string; 
  rating: number;
  folder_name: string;
  created_at: string;
  recipe?: Recipe;
}