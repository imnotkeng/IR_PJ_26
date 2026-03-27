import React from 'react';
import type { Recipe } from '../types/recipe';

interface RecipeModalProps {
  recipe: Recipe;
  onClose: () => void;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center p-4 z-50 backdrop-blur-sm">
      {/* กล่อง Modal */}
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl">
        
        {/* ปุ่มปิด */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 bg-white rounded-full w-8 h-8 flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 shadow-sm"
        >
          ✕
        </button>

        {/* รูปภาพใหญ่ */}
        <img 
          src={recipe.image_url} 
          alt={recipe.name} 
          className="w-full h-72 object-cover rounded-t-2xl"
        />
        
        {/* เนื้อหา */}
        <div className="p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{recipe.name}</h2>
          <p className="text-blue-600 font-semibold mb-6">⏱️ {recipe.minutes}</p>
          
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-3">Ingredients</h3>
           <p className="text-gray-700 leading-relaxed">
              {recipe.ingredients}
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-3">Instructions</h3>
            <p 
              className="text-gray-700 leading-relaxed whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: recipe.steps || "Instructions not available." }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};