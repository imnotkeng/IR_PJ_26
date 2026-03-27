import React from 'react';
import type { Recipe } from '../types/recipe';

interface Props {
  recipe: Recipe;
  onClick: (recipe: Recipe) => void;
}

export const RecipeCard = ({ recipe, onClick }: Props) => {
  return (
    <div 
      onClick={() => onClick(recipe)}
      className="border rounded-lg shadow-sm hover:shadow-lg transition-all cursor-pointer bg-white overflow-hidden transform hover:-translate-y-1"
    >
      <img 
        src={recipe.image_url} 
        alt={recipe.name} 
        loading="lazy" 
        className="w-full h-48 object-cover bg-gray-100"
        // ถ้าลิงก์รูปพัง ให้แสดงรูป Default แทน
        onError={(e) => { e.currentTarget.src = "https://placehold.co/600x400?text=No+Image" }}
      />
      <div className="p-4">
        <h3 className="font-bold text-lg mb-1 truncate">{recipe.name}</h3>
        <p className="text-sm text-gray-500">⏱️ {recipe.minutes}</p>
        
        {/* โชว์ Snippet สั้นๆ เป็นตัวอย่าง (ถ้ามี) */}
        {recipe.steps && (
          <p 
            className="text-sm text-gray-400 mt-2 line-clamp-2"
            dangerouslySetInnerHTML={{ __html: recipe.steps }} 
          />
        )}
      </div>
    </div>
  );
};