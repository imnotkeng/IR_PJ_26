import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search } from "lucide-react";
import { useSearchStore } from '@/store/searchStore';
import { useSearch } from '@/hooks/useSearch';
import { RecipeCard } from '@/components/RecipeCard';
import { RecipeModal } from '@/components/RecipeModal';
import { motion } from "framer-motion";
import type { Recipe } from '@/types/recipe';

// 1. Import the Suggestion Component and BookmarkModal
import { SearchSuggestion } from '@/components/SearchSuggestion'; 
import BookmarkModal from '@/components/BookmarkModal'; 

export const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const urlQuery = searchParams.get('q') || '';

  // 2. Add fetchSuggestion from your hook
  const { results, isLoading, suggestion } = useSearchStore();
  const { handleSearch, acceptSuggestion, fetchSuggestion } = useSearch(); 
  
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeToBookmark, setRecipeToBookmark] = useState<Recipe | null>(null);
  
  const [localSearch, setLocalSearch] = useState(urlQuery);
  
  // 3. Add state for the dropdown visibility and a timer reference
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trigger search when URL changes
  useEffect(() => {
    if (urlQuery) {
      handleSearch(urlQuery);
      setLocalSearch(urlQuery);
    }
  }, [urlQuery]);

  // 4. Fetch suggestions while typing (with debounce)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    // Only fetch if they typed at least 2 characters and it's different from the current URL query
    if (localSearch.trim().length >= 2 && localSearch !== urlQuery) {
      debounceRef.current = setTimeout(() => {
        fetchSuggestion(localSearch);
      }, 400);
    } else if (localSearch.trim().length < 2) {
      useSearchStore.getState().setSuggestion(null);
    }
    
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [localSearch, urlQuery]);

  // 5. Calculate if we should show the dropdown
  const showSuggestion = (
    (isFocused && localSearch.trim().length >= 2) ||
    (urlQuery && localSearch === urlQuery)
  ) && !!suggestion;

  const onNewSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsFocused(false);
    if (localSearch.trim()) {
      navigate(`/search?q=${encodeURIComponent(localSearch.trim())}`);
    }
  };

  const onAcceptSuggestion = (text: string) => {
    setLocalSearch(text);
    setIsFocused(false);
    navigate(`/search?q=${encodeURIComponent(text)}`);
    acceptSuggestion(text);
  };

  // 6. Performance fixes for the recipe cards
  const handleRecipeClick = useCallback((recipe: Recipe) => {
    setSelectedRecipe(recipe);
  }, []);

  const handleBookmarkClick = useCallback((recipe: Recipe) => {
    setRecipeToBookmark(recipe);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/50 pt-24 pb-20">
      <div className="container mx-auto px-6 max-w-7xl">
        
        {/* SEARCH BAR WITH DROPDOWN */}
        <div className="mb-12">
          {/* We wrap everything in a relative div so the dropdown positions correctly */}
          <div className="relative max-w-2xl">
            <form onSubmit={onNewSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 150)} // Delay hides dropdown so clicks work
                className="w-full pl-12 pr-24 py-3 rounded-2xl border border-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="Search recipes..."
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 text-white px-4 py-1.5 rounded-xl text-sm font-semibold hover:bg-blue-600 transition"
              >
                Search
              </button>
            </form>

            {/* The Dropdown component! */}
            <SearchSuggestion
              suggestion={suggestion}
              visible={showSuggestion}
              onAccept={onAcceptSuggestion}
            />
          </div>
        </div>

        {/* RESULTS HEADER */}
        {results && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 border-b border-slate-200 pb-4"
          >
            <h2 className="font-display text-3xl font-bold text-slate-800 mb-2">
              Search Results for "{urlQuery}"
            </h2>
            <p className="text-slate-500">
              Found {results.length} amazing recipes
            </p>
          </motion.div>
        )}

        {/* RESULTS GRID */}
        {isLoading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <span className="text-slate-500 font-medium">Loading amazing dishes...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {results?.map((recipe, index) => (
              <RecipeCard 
                key={recipe.id} 
                recipe={recipe} 
                index={index}
                onClick={handleRecipeClick} 
                onBookmarkClick={handleBookmarkClick}
              />
            ))}
          </div>
        )}

        {/* RECIPE MODAL */}
        {selectedRecipe && (
          <RecipeModal 
            recipe={selectedRecipe} 
            onClose={() => setSelectedRecipe(null)} 
            onBookmarkClick={handleBookmarkClick}
          />
        )}

        {/* BOOKMARK MODAL */}
        {recipeToBookmark && (
          <BookmarkModal
            isOpen={!!recipeToBookmark}
            onClose={() => setRecipeToBookmark(null)}
            recipeId={Number(recipeToBookmark.id)} 
            recipeName={recipeToBookmark.name}
          />
        )}
        
      </div>
    </div>
  );
};