// store/searchStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useSearchStore } from './searchStore';
import type { Recipe } from '../types/recipe';

describe('searchStore', () => {
  // Reset the store to its initial state before every single test
  // This prevents data from one test leaking into another!
  beforeEach(() => {
    useSearchStore.setState({
      query: '',
      results: [],
      isLoading: false,
      suggestion: null,
    });
  });

  it('should update the query string', () => {
    useSearchStore.getState().setQuery('chicken');
    expect(useSearchStore.getState().query).toBe('chicken');
  });

  it('should update the results array', () => {
    const mockRecipes: Recipe[] = [
      { id: '1', name: 'Fried Chicken', minutes: 30, image_url: '', ingredients: '', steps: '', score: 1 }
    ];
    
    useSearchStore.getState().setResults(mockRecipes);
    expect(useSearchStore.getState().results).toEqual(mockRecipes);
  });

  it('should toggle the isLoading state', () => {
    useSearchStore.getState().setIsLoading(true);
    expect(useSearchStore.getState().isLoading).toBe(true);
  });

  it('should set the spelling suggestion', () => {
    useSearchStore.getState().setSuggestion('garlic');
    expect(useSearchStore.getState().suggestion).toBe('garlic');
  });
});