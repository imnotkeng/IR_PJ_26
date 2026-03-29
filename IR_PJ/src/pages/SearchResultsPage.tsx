import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search } from "lucide-react";
import { useSearchStore } from '@/store/searchStore';
import { useSearch } from '@/hooks/useSearch';
import { RecipeCard } from '@/components/RecipeCard';
import { RecipeModal } from '@/components/RecipeModal';
import { motion } from "framer-motion";
import type { Recipe } from '@/types/recipe';

// 👈 NEW: Import the BookmarkModal we created earlier
import BookmarkModal from '@/components/BookmarkModal'; 

export const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const urlQuery = searchParams.get('q') || '';

  const { results, isLoading, suggestion } = useSearchStore();
  const { handleSearch, acceptSuggestion } = useSearch();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  
  // 👈 NEW: State to track which recipe the user wants to bookmark
  const [recipeToBookmark, setRecipeToBookmark] = useState<Recipe | null>(null);
  
  const [localSearch, setLocalSearch] = useState(urlQuery);

  useEffect(() => {
    if (urlQuery) {
      handleSearch(urlQuery);
      setLocalSearch(urlQuery);
    }
  }, [urlQuery]);

  const onNewSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (localSearch.trim()) {
      navigate(`/search?q=${encodeURIComponent(localSearch.trim())}`);
    }
  };

  const onAcceptSuggestion = (text: string) => {
    navigate(`/search?q=${encodeURIComponent(text)}`);
    acceptSuggestion(text);
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pt-24 pb-20">
      <div className="container mx-auto px-6 max-w-7xl">
        
        {/* SMALL SEARCH BAR AT THE TOP */}
        <div className="mb-12">
          <form onSubmit={onNewSearch} className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
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
        </div>

        {/* SUGGESTION BANNER */}
        {suggestion && (
          <div className="mb-8 p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-center max-w-2xl shadow-sm">
            Did you mean: {' '}
            <button onClick={() => onAcceptSuggestion(suggestion)} className="font-bold underline hover:text-amber-600 transition-colors">
              {suggestion}
            </button>
            ?
          </div>
        )}

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
                onClick={(clickedRecipe) => setSelectedRecipe(clickedRecipe)} 
                
                // 👈 NEW: Pass the bookmark click handler down to the RecipeCard
                onBookmarkClick={(clickedRecipe) => setRecipeToBookmark(clickedRecipe)}
              />
            ))}
          </div>
        )}

        {/* RECIPE MODAL */}
        {selectedRecipe && (
          <RecipeModal 
            recipe={selectedRecipe} 
            onClose={() => setSelectedRecipe(null)} 
            
            // 👈 NEW: Pass the bookmark click handler down to the RecipeModal
            onBookmarkClick={(clickedRecipe) => setRecipeToBookmark(clickedRecipe)}
          />
        )}

        {/* 👈 NEW: Render the BookmarkModal when a recipe is selected to be saved */}
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