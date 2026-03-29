import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bookmark, Clock, ArrowLeft } from "lucide-react";
import type { Recipe } from '@/types/recipe';
import BookmarkModal from '@/components/BookmarkModal'; // We can still allow them to re-bookmark/update it here!

export default function RecipePage() {
  const { recipeId } = useParams<{ recipeId: string }>();
  const navigate = useNavigate();
  
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State to trigger the bookmark modal
  const [isBookmarkModalOpen, setIsBookmarkModalOpen] = useState(false);

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!recipeId) return;
      try {
        const response = await axios.get(`http://127.0.0.1:5001/api/recipes/${recipeId}`);
        setRecipe(response.data);
      } catch (err) {
        setError("Failed to load recipe details. It may have been removed.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipe();
  }, [recipeId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500">Preparing your recipe...</p>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <p className="text-red-500 text-lg mb-4">{error}</p>
        <button onClick={() => navigate(-1)} className="text-blue-500 hover:underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      {/* 1. Hero Image Section */}
      <div className="relative h-[40vh] md:h-[50vh] w-full">
        <img 
          src={recipe.image_url} 
          alt={recipe.name} 
          className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.src = "https://placehold.co/1200x600?text=No+Image" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
        
        {/* Top Navigation Bar */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
          <button 
            onClick={() => navigate(-1)} // Goes back to the previous page
            className="bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full px-4 py-2 text-white font-medium shadow-sm transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <button 
            onClick={() => setIsBookmarkModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-5 py-2.5 flex items-center gap-2 font-medium shadow-lg transition-all"
          >
            <Bookmark className="w-4 h-4" /> Save Recipe
          </button>
        </div>

        {/* Title overlaying image */}
        <div className="absolute bottom-10 left-6 right-6 md:left-20 md:right-20">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg leading-tight">
            {recipe.name}
          </h1>
        </div>
      </div>
      
      {/* 2. Content Container (pulled up slightly over the image) */}
      <div className="max-w-4xl mx-auto -mt-8 relative bg-white rounded-t-3xl shadow-xl p-8 md:p-12 border border-slate-100">
        
        {/* Meta info tag */}
        <div className="flex items-center gap-2 mb-10 bg-blue-50 text-blue-700 w-fit px-5 py-2.5 rounded-full font-semibold text-sm shadow-sm border border-blue-100">
          <Clock className="w-4 h-4" />
          <span>{recipe.minutes} mins</span>
        </div>
        
        {/* Ingredients */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-slate-800 border-b-2 border-slate-100 pb-3 mb-6">
            Ingredients
          </h3>
          <p className="text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-2xl text-lg border border-slate-100">
            {recipe.ingredients}
          </p>
        </div>

        {/* Instructions */}
        <div>
          <h3 className="text-2xl font-bold text-slate-800 border-b-2 border-slate-100 pb-3 mb-6">
            Instructions
          </h3>
          <div 
            className="text-slate-600 leading-relaxed whitespace-pre-line prose prose-slate max-w-none text-lg"
            dangerouslySetInnerHTML={{ __html: recipe.steps || "Instructions not available." }}
          />
        </div>
      </div>

      {/* 3. Bookmark Modal (if they decide to save it again or move it to a new folder) */}
      {isBookmarkModalOpen && (
        <BookmarkModal
          isOpen={isBookmarkModalOpen}
          onClose={() => setIsBookmarkModalOpen(false)}
          recipeId={Number(recipe.id)} // Make sure to convert to Number!
          recipeName={recipe.name}
        />
      )}

    </div>
  );
}