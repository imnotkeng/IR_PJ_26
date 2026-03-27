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