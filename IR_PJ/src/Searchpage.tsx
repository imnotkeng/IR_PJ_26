import React, { useState } from 'react';
import { SearchBar } from './components/searchBar';
import { useSearchStore } from './store/searchStore';
import { useSearch } from './hooks/useSearch';
import { RecipeCard } from './components/RecipeCard';
import { RecipeModal } from './components/RecipeModal';
import type { Recipe } from './types/recipe';

export const Searchpage = () => {
  const { results, isLoading, suggestion } = useSearchStore();
  const { acceptSuggestion } = useSearch();
  
  // State สำหรับเก็บว่าผู้ใช้คลิกเลือกเมนูไหนอยู่ (เพื่อเอาไปโชว์ใน Modal)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">Find Your Recipes</h1>
      
      <div className="max-w-2xl mx-auto">
        <SearchBar />
      </div>

      {suggestion && (
        <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg text-center max-w-2xl mx-auto">
          Did you mean: {' '}
          <button onClick={acceptSuggestion} className="font-bold underline hover:text-yellow-600">
            {suggestion}
          </button>
          ?
        </div>
      )}

      {isLoading && (
        <div className="mt-8 text-center text-gray-500 font-medium">
          <span className="animate-pulse">Loading amazing dishes...</span>
        </div>
      )}

      {/* Grid สำหรับแสดงการ์ด */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
        {results?.map((recipe) => (
          <RecipeCard 
            key={recipe.id} 
            recipe={recipe} 
            onClick={(clickedRecipe) => setSelectedRecipe(clickedRecipe)} 
          />
        ))}
      </div>

      {/* แสดง Modal เมื่อมี selectedRecipe */}
      {selectedRecipe && (
        <RecipeModal 
          recipe={selectedRecipe} 
          onClose={() => setSelectedRecipe(null)} 
        />
      )}
    </div>
  );
};