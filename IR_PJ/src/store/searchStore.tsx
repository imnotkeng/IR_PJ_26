import { create } from 'zustand';
import type { Recipe } from '../types/recipe';

interface SearchState {
  query: string;
  results: Recipe[];
  isLoading: boolean;
  suggestion: string | null;
  setQuery: (query: string) => void;
  setResults: (results: Recipe[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setSuggestion: (suggestion: string | null) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: '',
  results: [],
  isLoading: false,
  suggestion: null,
  setQuery: (query) => set({ query }),
  setResults: (results) => set({ results }),
  setIsLoading: (isLoading) => set({ isLoading }),
 // searchStore.ts
setSuggestion: (suggestion: string | null) => set({ suggestion }),
}));

