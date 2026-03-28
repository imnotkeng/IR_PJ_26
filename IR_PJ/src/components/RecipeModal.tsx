import React from 'react';
import type { Recipe } from '../types/recipe';

interface RecipeModalProps {
  recipe: Recipe;
  onClose: () => void;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 flex justify-center items-center p-4 z-50 backdrop-blur-sm transition-all duration-300">
      {/* กล่อง Modal */}
      <div className="bg-white rounded-[2rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* ปุ่มปิด */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 bg-white/80 backdrop-blur-md rounded-full w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white shadow-sm transition-all z-10"
        >
          ✕
        </button>

        {/* รูปภาพใหญ่ */}
        <div className="relative h-80 w-full">
          <img 
            src={recipe.image_url} 
            alt={recipe.name} 
            className="w-full h-full object-cover rounded-t-[2rem]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <h2 className="absolute bottom-6 left-8 right-8 text-3xl font-bold text-white drop-shadow-md">
            {recipe.name}
          </h2>
        </div>
        
        {/* เนื้อหา */}
        <div className="p-8">
          <div className="flex items-center gap-2 mb-8 bg-blue-50 text-blue-600 w-fit px-4 py-2 rounded-full font-semibold text-sm">
            <span>⏱️</span>
            <span>{recipe.minutes}</span>
          </div>
          
          <div className="mb-8">
            <h3 className="text-xl font-bold text-slate-800 border-b-2 border-slate-100 pb-3 mb-4">Ingredients</h3>
            <p className="text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-2xl">
              {recipe.ingredients}
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-slate-800 border-b-2 border-slate-100 pb-3 mb-4">Instructions</h3>
            <div 
              className="text-slate-600 leading-relaxed whitespace-pre-line prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: recipe.steps || "Instructions not available." }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};