import React, { useEffect, useState } from 'react';
import { Bookmark, Sparkles, CheckCircle2 } from "lucide-react";
import type { Recipe } from '../types/recipe';
import { formatDuration } from '@/lib/utils';
import { apiClient } from '@/service/apiClient';

interface RecipeModalProps {
  recipe: Recipe;
  onClose: () => void;
  onBookmarkClick: (recipe: Recipe) => void; 
  onSimilarClick?: (recipe: any) => void;
}

export const RecipeModal: React.FC<RecipeModalProps> = ({ recipe, onClose, onBookmarkClick }) => {

  const [similarRecipes, setSimilarRecipes] = useState<any[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);

  useEffect(() => {
    // เมื่อ Modal เปิด ให้ยิง API ไปหาเมนูที่คล้ายกัน
    const fetchSimilar = async () => {
      setIsLoadingSimilar(true);
      try {
        const res = await apiClient.get(`/api/recipes/${recipe.id}/similar`);
        setSimilarRecipes(res.data);
      } catch (err) {
        console.error("Failed to load similar recipes");
      } finally {
        setIsLoadingSimilar(false);
      }
    };
    
    if (recipe.id) {
      fetchSimilar();
    }
  }, [recipe.id]);

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
            loading="lazy"
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
            <span>{formatDuration(recipe.minutes)}</span>
          </div>


          {/* {"feature 1 Exciting IR features "} */}
          {recipe.reasons && recipe.reasons.length > 0 && (
            <div className="mb-10 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-purple-700 font-bold text-lg">
                <Sparkles className="w-5 h-5" />
                <h3>Why we recommend this for you</h3>
              </div>
              <ul className="space-y-3">
                {recipe.reasons.map((reason, index) => (
                  <li key={index} className="flex items-start gap-3 text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
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

          <div className="mt-12 pt-8 border-t-2 border-slate-100">
            <div className="flex items-center gap-2 mb-6">
              <ChefHat className="w-6 h-6 text-orange-500" />
              <h3 className="text-2xl font-bold text-slate-800">Similar Recipes</h3>
            </div>
            
            {isLoadingSimilar ? (
              <p className="text-slate-400">Finding similar recipes...</p>
            ) : similarRecipes.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {similarRecipes.map((simRec) => (
                  <div 
                    key={simRec.id} 
                    onClick={() => onSimilarClick && onSimilarClick(simRec)} 
                    className={`group flex flex-col bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all ${onSimilarClick ? 'cursor-pointer' : ''}`}
                  >
                    <div className="relative h-28 overflow-hidden bg-slate-100">
                      <img 
                        src={simRec.image_url} 
                        alt={simRec.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.currentTarget.src = "https://placehold.co/300x200?text=No+Image" }}
                      />
                    </div>
                    <div className="p-3">
                      <h4 className="font-bold text-slate-800 text-sm line-clamp-2 mb-1">{simRec.name}</h4>
                      <p className="text-xs text-slate-500">{formatDuration(simRec.minutes)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400">No similar recipes found.</p>
            )}
          </div>
          {/* 👆 END MORE LIKE THIS */}
        </div>

      </div>
    </div>
  );
};