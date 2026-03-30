import React, { useState, useCallback } from 'react';
import { SearchBar } from '@/components/searchBar';
import { useSearchStore } from '@/store/searchStore';
import { RecipeCard } from '@/components/RecipeCard';
import { RecipeModal } from '@/components/RecipeModal';
import { motion } from "framer-motion";
import type { Recipe } from '@/types/recipe';
import BookmarkModal from '@/components/BookmarkModal';
export const Searchpage = () => {
  // We can remove 'suggestion' from here since SearchBar handles it
  const { results, isLoading, query } = useSearchStore(); 
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeToBookmark, setRecipeToBookmark] = useState<Recipe | null>(null);
  const handleBookmarkClick = useCallback((recipe: Recipe) => {
    setRecipeToBookmark(recipe);
  }, []);

  // This stops React from slowing down when you type
  const handleRecipeClick = useCallback((recipe: Recipe) => {
    setSelectedRecipe(recipe);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <SearchBar />

      <div className="container mx-auto px-6 max-w-7xl">
        
        {/* Section Header */}
        {results && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="font-display text-3xl font-bold text-slate-800 mb-2">
              {query ? `Search Results for "${query}"` : "Recommended for You"}
            </h2>
            <p className="text-slate-500">
              {query ? `Found ${results.length} amazing recipes` : "Based on your bookmarks and favorites"}
            </p>
          </motion.div>
        )}

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

        {selectedRecipe && (
          <RecipeModal 
            recipe={selectedRecipe} 
            onClose={() => setSelectedRecipe(null)} 
            onBookmarkClick={handleBookmarkClick}
            
          />
        )}

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