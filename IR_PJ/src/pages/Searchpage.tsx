import React, { useState } from 'react';
import { SearchBar } from '@/components/searchBar';
import { useSearchStore } from '@/store/searchStore';
import { useSearch } from '@/hooks/useSearch';
import { RecipeCard } from '@/components/RecipeCard';
import { RecipeModal } from '@/components/RecipeModal';
import { motion } from "framer-motion";
import type { Recipe } from '@/types/recipe';

export const Searchpage = () => {
  const { results, isLoading, suggestion, query } = useSearchStore();
  const { acceptSuggestion } = useSearch();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* ใส่ SearchBar ที่มี Hero UI ไว้ด้านบนสุด */}
      <SearchBar />

      <div className="container mx-auto px-6 max-w-7xl">
        {suggestion && (
          <div className="mb-8 p-4 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-center max-w-2xl mx-auto shadow-sm">
            Did you mean: {' '}
            <button onClick={acceptSuggestion} className="font-bold underline hover:text-amber-600 transition-colors">
              {suggestion}
            </button>
            ?
          </div>
        )}

        {/* Section Header สไตล์รูปที่ 2 */}
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
                onClick={(clickedRecipe) => setSelectedRecipe(clickedRecipe)} 
              />
            ))}
          </div>
        )}

        {selectedRecipe && (
          <RecipeModal 
            recipe={selectedRecipe} 
            onClose={() => setSelectedRecipe(null)} 
          />
        )}
      </div>
    </div>
  );
};