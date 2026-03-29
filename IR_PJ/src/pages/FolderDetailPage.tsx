import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '@/service/apiClient';
import { bookmarkService } from '@/service/bookmarkService';
import { type Bookmark } from '@/types/recipe';
import { useFolderStore } from '@/store/folderStore';
import { Star, Trash2, Sparkles, Loader2 } from "lucide-react";
import { type Recommendation, type Recipe, type SimilarRecipe } from '@/types/recipe';
import { formatDuration } from '@/lib/utils';
import { RecipeModal } from '@/components/RecipeModal'; 
import BookmarkModal from '@/components/BookmarkModal'; 

export default function FolderDetailPage() {
  const { folderId } = useParams<{ folderId: string }>();
  const navigate = useNavigate();
  
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeToBookmark, setRecipeToBookmark] = useState<Recipe | null>(null);

  const { folders } = useFolderStore();
  const currentFolder = folders.find(f => f.id === Number(folderId));

  useEffect(() => {
    const fetchFolderBookmarks = async () => {
      if (!folderId) return;
      try {
        const bookmarkData = await bookmarkService.getFolderBookmarks(Number(folderId));
        const populatedBookmarks = await Promise.all(
          bookmarkData.map(async (bookmark) => {
            try {
             const recipeResponse = await apiClient.get(`/api/recipes/${bookmark.recipe_id}`);
              return { ...bookmark, recipe: recipeResponse.data };
            } catch {
              return bookmark; 
            }
          })
        );
        setBookmarks(populatedBookmarks);
      } catch (error) {
        console.error("Failed to load folder bookmarks", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFolderBookmarks();
  }, [folderId]);

  const handleDelete = async (e: React.MouseEvent, bookmarkId: number) => {
    e.stopPropagation(); 
    if (!window.confirm("Are you sure you want to remove this recipe from the folder?")) return;

    try {
      await bookmarkService.deleteBookmark(bookmarkId);
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    } catch {
      alert("Could not delete the bookmark. Please try again.");
    }
  };

  const handleGetSuggestions = async () => {
    setIsGenerating(true);
    setHasGenerated(true);
    try {
      const response = await apiClient.get(`/api/recommendations/folder/${folderId}`);
      setRecommendations(response.data);
    } catch  {
      alert("Could not generate suggestions. Please make sure your ML server is running.");
      setHasGenerated(false);
    } finally {
      setIsGenerating(false);
    }
  };


const handleOpenRecipe = async (recipeData: Recipe | Recommendation | SimilarRecipe | undefined) => {

  if (!recipeData) return;
    try {
        const id = 'recipe_id' in recipeData ? recipeData.recipe_id : recipeData.id;
        const response = await apiClient.get(`/api/recipes/${id}`);
        // Merge reasons if they came from an ML recommendation
        const fullRecipe = {
            ...response.data,
            reasons: recipeData.reasons 
        };
        setSelectedRecipe(fullRecipe);
    } catch (error) {
        console.error("Failed to fetch full recipe", error);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Opening folder...</div>;

  return (
    <div className="min-h-screen bg-slate-50/50 pt-10 pb-20">
      <div className="p-6 max-w-6xl mx-auto">
        <button onClick={() => navigate('/folders')} className="text-blue-500 hover:underline mb-6 flex items-center gap-2">
          ← Back to Folders
        </button>

        {/* Folder Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-gray-200 pb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-yellow-100 p-4 rounded-full">
              <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{currentFolder ? currentFolder.name : "Folder Details"}</h1>
              <p className="text-gray-500">{bookmarks.length} saved recipes inside</p>
            </div>
          </div>
          {bookmarks.length > 0 && (
            <button onClick={handleGetSuggestions} disabled={isGenerating} className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-bold shadow-md transition-all disabled:opacity-70">
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {isGenerating ? "Analyzing Tastes..." : "Get Smart Suggestions"}
            </button>
          )}
        </div>

        {/* Bookmarks Grid */}
        {bookmarks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
            <p className="text-gray-500 text-lg">This folder is empty.</p>
            <button onClick={() => navigate('/search')} className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition">
              Discover Recipes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {bookmarks.map((bookmark) => (
              <div 
                key={bookmark.id} 
                onClick={() => handleOpenRecipe(bookmark.recipe)} 
              
                className="group flex flex-col bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all cursor-pointer h-full relative"
              >
                <button
                  onClick={(e) => handleDelete(e, bookmark.id)}
                  className="absolute top-3 left-3 bg-white/90 hover:bg-red-50 text-slate-400 hover:text-red-500 p-2 rounded-full shadow-sm z-20 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Remove from folder"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <div className="relative aspect-square overflow-hidden bg-slate-100 shrink-0">
                  <img
                    loading="lazy"
                    src={bookmark.recipe?.image_url || "https://placehold.co/600x600?text=No+Image"}
                    alt={bookmark.recipe?.name || "Recipe"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-amber-600 flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-bold shadow-sm z-10">
                    <Star className="w-4 h-4 fill-current" /> {bookmark.rating}
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="font-display text-lg font-bold text-slate-800 mb-2 line-clamp-2">
                    {bookmark.recipe?.name || `Recipe #${bookmark.recipe_id}`}
                  </h3>
                  <div className="mt-auto pt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-50">
                    <span>{formatDuration(bookmark.recipe?.minutes ? `${bookmark.recipe.minutes} mins` : '')}</span>
                    <span>Saved: {new Date(bookmark.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ML Suggestions Grid */}
        {hasGenerated && (
          <div className="mt-20 border-t border-gray-200 pt-12">
            <div className="flex items-center gap-3 mb-8">
              <Sparkles className="w-8 h-8 text-purple-500" />
              <h2 className="text-3xl font-bold text-gray-800">You Might Also Like</h2>
            </div>
            
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
                <p className="text-gray-500">Our AI is analyzing your taste profile...</p>
              </div>
            ) : recommendations.length === 0 ? (
              <p className="text-gray-500">Could not find any new matches. Try adding more recipes to your folder!</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {recommendations.map((rec) => (
                  <div 
                    key={rec.id} 
                    onClick={() => handleOpenRecipe(rec)} 
                    className="group flex flex-col bg-gradient-to-b from-purple-50 to-white rounded-2xl border border-purple-100 overflow-hidden hover:shadow-xl transition-all cursor-pointer h-full relative"
                  >
                    <div className="relative aspect-square overflow-hidden bg-slate-100 shrink-0">
                      <img
                      loading="lazy"
                        src={rec.image_url}
                        alt={rec.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 bg-purple-600 text-white flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm z-10">
                        Score: {(rec.prediction_score * 100).toFixed(0)}
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="font-display text-lg font-bold text-slate-800 mb-2 line-clamp-2">
                        {rec.name}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedRecipe && (
          <RecipeModal 
            recipe={selectedRecipe} 
            onClose={() => setSelectedRecipe(null)} 
            onBookmarkClick={(recipe) => setRecipeToBookmark(recipe)}
            onSimilarClick={(recipe) => handleOpenRecipe(recipe)}
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
}