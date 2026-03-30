import React, { useEffect, useState, useCallback} from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/service/apiClient';
import { bookmarkService} from '@/service/bookmarkService';
import { useAuthStore } from '@/store/authStore';
import { Star, Trash2, BookOpen } from "lucide-react";
import { type Bookmark, type Recipe } from '@/types/recipe'; 
import { formatDuration } from '@/lib/utils';
import { RecipeModal } from '@/components/RecipeModal'; 
import BookmarkModal from '@/components/BookmarkModal'; 

export default function BookmarksPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
 const [isLoading, setIsLoading] = useState(false);
  // Modal states
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeToBookmark, setRecipeToBookmark] = useState<Recipe | null>(null);

  const fetchAllBookmarks = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const bookmarkData = await bookmarkService.getUserBookmarks(user.id);
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
      console.error("Failed to load all bookmarks", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAllBookmarks();
  }, [fetchAllBookmarks]);


  const handleDelete = async (e: React.MouseEvent, bookmarkId: number) => {
    e.stopPropagation(); 
    if (!window.confirm("Are you sure you want to delete this bookmark?")) return;
    try {
      await bookmarkService.deleteBookmark(bookmarkId);
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    } catch (error) {
      console.error("Failed to delete bookmark:", error);
      alert("Could not delete the bookmark. Please try again.");
    }
  };

  const handleOpenRecipe = async (recipeData: { id?: string | number; recipe_id?: string | number }) => {
    try {
        const response = await apiClient.get(`/api/recipes/${recipeData.id || recipeData.recipe_id}`);
        setSelectedRecipe(response.data);
    } catch (error) {
        console.error("Failed to fetch full recipe", error);
    }
  };

  


  return (

    <div className="min-h-screen bg-slate-50/50 pt-10 pb-20">
      <div className="p-6 max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8 border-b border-gray-200 pb-6">
          <div className="bg-blue-100 p-4 rounded-full">
            <BookOpen className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">All Saved Recipes</h1>
            <p className="text-gray-500">Everything you love, ranked by your ratings.</p>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col bg-white rounded-2xl border border-slate-100 overflow-hidden h-full animate-pulse">
              <div className="aspect-square bg-slate-200" />
              <div className="p-5 flex flex-col gap-3">
                <div className="h-3 bg-slate-200 rounded w-1/3" />
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-4 bg-slate-200 rounded w-2/3" />
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between">
                  <div className="h-3 bg-slate-200 rounded w-1/4" />
                  <div className="h-3 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) :bookmarks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
            <p className="text-gray-500 text-lg">Your vault is empty.</p>
            <button 
              onClick={() => navigate('/search')}
              className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition"
            >
              Discover Recipes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {bookmarks.map((bookmark) => (
              <div 
                key={bookmark.id} 
                onClick={() => handleOpenRecipe(bookmark.recipe || { recipe_id: bookmark.recipe_id })}
                className="group flex flex-col bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl transition-all cursor-pointer h-full relative"
              >
                <button
                  onClick={(e) => handleDelete(e, bookmark.id)}
                  className="absolute top-3 left-3 bg-white/90 hover:bg-red-50 text-slate-400 hover:text-red-500 p-2 rounded-full shadow-sm z-20 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Remove bookmark"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <div className="relative aspect-square overflow-hidden bg-slate-100 shrink-0">
                  <img
                    loading="lazy"
                    src={bookmark.recipe?.image_url || "https://placehold.co/600x600?text=No+Image"}
                    alt={bookmark.recipe?.name || "Recipe"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.currentTarget.src = "https://placehold.co/600x400?text=No+Image" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-amber-600 flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-bold shadow-sm z-10">
                    <Star className="w-4 h-4 fill-current" /> {bookmark.rating}
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-grow">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 mb-1">
                    {bookmark.folder_name}
                  </span>
                  
                  <h3 className="font-display text-lg font-bold text-slate-800 mb-2 line-clamp-2">
                    {bookmark.recipe?.name || `Recipe #${bookmark.recipe_id}`}
                  </h3>
                  
                  <div className="mt-auto pt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-50">
                    <span>{formatDuration(bookmark.recipe?.minutes ? `${bookmark.recipe.minutes} ` : '')}</span>
                    <span>Saved: {new Date(bookmark.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Render the Recipe Modal */}
        {selectedRecipe && (
          <RecipeModal 
            recipe={selectedRecipe} 
            onClose={() => setSelectedRecipe(null)} 
            onBookmarkClick={(recipe) => setRecipeToBookmark(recipe)}
            onSimilarClick={(recipe) => handleOpenRecipe(recipe)}
          />
        )}

        {/* Render the Bookmark Modal */}
        {recipeToBookmark && (
          <BookmarkModal
            isOpen={!!recipeToBookmark}
            onClose={() => {
              setRecipeToBookmark(null);
            
              fetchAllBookmarks(); 
            }}
            recipeId={Number(recipeToBookmark.id)} 
            recipeName={recipeToBookmark.name}
          />
        )}

      </div>
    </div>
  );
}