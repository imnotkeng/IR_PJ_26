import React from 'react';
import { Bookmark } from "lucide-react"; // 👈 Import icon
import type { Recipe } from '../types/recipe';

interface RecipeModalProps {
  recipe: Recipe;
  onClose: () => void;
  onBookmarkClick: (recipe: Recipe) => void; // 👈 NEW PROP
}

export const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, onClose, onBookmarkClick }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 flex justify-center items-center p-4 z-40 backdrop-blur-sm transition-all duration-300">
      
      <div className="bg-white rounded-[2rem] max-w-3xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-3 z-10">
          {/* Save Button */}
          <button 
            onClick={() => onBookmarkClick(recipe)}
            className="bg-white/90 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 text-slate-700 hover:text-white hover:bg-blue-500 shadow-sm transition-all font-medium text-sm"
          >
            <Bookmark className="w-4 h-4" /> Save
          </button>
          
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="bg-white/90 backdrop-blur-md rounded-full w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white shadow-sm transition-all"
          >
            ✕
          </button>
        </div>

        {/* Hero Image */}
        <div className="relative h-96 w-full">
          <img 
            src={recipe.image_url} 
            alt={recipe.name} 
            className="w-full h-full object-cover rounded-t-[2rem]"
            onError={(e) => { e.currentTarget.src = "https://placehold.co/1000x600?text=No+Image" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <h2 className="absolute bottom-8 left-8 right-8 text-4xl font-extrabold text-white drop-shadow-lg leading-tight">
            {recipe.name}
          </h2>
        </div>
        
        {/* Content */}
        <div className="p-8 md:p-10">
          <div className="flex items-center gap-2 mb-8 bg-blue-50 text-blue-600 w-fit px-5 py-2.5 rounded-full font-semibold text-sm">
            <span>⏱️</span>
            <span>{recipe.minutes} mins</span>
          </div>
          
          <div className="mb-10">
            <h3 className="text-2xl font-bold text-slate-800 border-b-2 border-slate-100 pb-3 mb-6">Ingredients</h3>
            <p className="text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-2xl text-lg">
              {recipe.ingredients}
            </p>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-slate-800 border-b-2 border-slate-100 pb-3 mb-6">Instructions</h3>
            <div 
              className="text-slate-600 leading-relaxed whitespace-pre-line prose prose-slate max-w-none text-lg"
              dangerouslySetInnerHTML={{ __html: recipe.steps || "Instructions not available." }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};