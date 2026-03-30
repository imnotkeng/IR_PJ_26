import axios from 'axios';
import type { SearchResponse } from '../types/recipe';
import { API_URL } from '../config';
const api = axios.create({
  baseURL: API_URL, 

});

export const searchRecipesApi = async (query: string): Promise<SearchResponse> => {
  const response = await api.get('/search', {
    params: { q: query }
  });
  console.log(response.data)
  return response.data;
};

export const getSpellSuggestionApi = async (query: string): Promise<string | null> => {
  const response = await api.get('/api/suggest', {
    params: { q: query }
  });
  return response.data.suggestion;
};