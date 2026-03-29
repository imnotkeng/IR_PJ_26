export interface Recipe {
  id: string;
  name: string;
  ingredients: string;
  steps: string;
  image_url: string;
  minutes: number;
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
}