import axios from 'axios';
import type { SearchResponse } from '../types/recipe';

const api = axios.create({
  baseURL: 'http://127.0.0.1:5001', 
});

export const searchRecipesApi = async (query: string): Promise<SearchResponse> => {
  const response = await api.get('/search', {
    params: { q: query }
  });
  console.log(response.data)
  return response.data;
};