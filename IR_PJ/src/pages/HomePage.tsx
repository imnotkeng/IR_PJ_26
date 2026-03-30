import React, { useEffect, useState } from 'react';
import { apiClient } from '@/service/apiClient';
import { SearchBar } from '@/components/searchBar';
import { RecipeCarousel } from '@/components/RecipeCarousel';
import { useAuthStore } from '@/store/authStore';
import { RecipeModal } from '@/components/RecipeModal';
import type { Recipe, CarouselRecipe } from '@/types/recipe';
import BookmarkModal from '@/components/BookmarkModal';

export const HomePage = () => {
  const { user } = useAuthStore();
  
  const [summaryList, setSummaryList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [categoryName, setCategoryName] = useState("Your Favorites");
  const [randomList, setRandomList] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recipeToBookmark, setRecipeToBookmark] = useState<Recipe | null>(null);

  useEffect(() => {
    const fetchHomeData = async () => {
      setIsLoading(true);
      try {
        // Fetch Random Dishes (Always loads for everyone)
        // const randomRes = await axios.get('http://127.0.0.1:5001/api/recommendations/random');
        const randomRes = await apiClient.get('/api/recommendations/random');
        setRandomList(randomRes.data);

        // Fetch Personal ML Lists if user is logged in
        if (user?.id) {
          // const personalRes = await axios.get(`http://127.0.0.1:5001/api/recommendations/home/${user.id}`);
          const personalRes = await apiClient.get(`/api/recommendations/home/${user.id}`);
          setSummaryList(personalRes.data.summary_list);
          setCategoryList(personalRes.data.category_list);
          setCategoryName(personalRes.data.category_name);
        }
      } catch (error) {
        console.error("Failed to fetch home recommendations", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHomeData();
  }, [user]);

  const handleRecipeClick = async (recipePreview: CarouselRecipe) => {
    try {
      
      const response = await apiClient.get(`/api/recipes/${recipePreview.id}`);

      const fullRecipe = {
        ...response.data,
        reasons: recipePreview.reasons // <-- This saves the reasons!
      };
      
      setSelectedRecipe(fullRecipe);
    } catch (error) {
      console.error("Failed to load full recipe details", error);
      alert("Could not load the recipe details right now.");
    }
  };


 return (
    <div className="bg-slate-50 min-h-screen pb-12 overflow-x-hidden">
      <SearchBar />

      {user && (isLoading || summaryList.length > 0) && (
            <RecipeCarousel 
              title="Recommended For You"
              subtitle="Based on everything you have saved"
              recipes={summaryList} 
              isLoading={isLoading} 
              onRecipeClick={handleRecipeClick}
            />
          )}

          {user && (isLoading || categoryList.length > 0) && (
            <RecipeCarousel 
              title={`Because you like ${categoryName}`}
              subtitle="Smart suggestions from your folder"
              recipes={categoryList} 
              isLoading={isLoading} 
              onRecipeClick={handleRecipeClick}
            />
          )}
      <RecipeCarousel 
        title="Discover Something New" 
        subtitle="Random dishes to inspire your next meal"
        recipes={randomList} 
        isLoading={isLoading} 
        onRecipeClick={handleRecipeClick}
      />

      {/* 3. Render the Recipe Modal */}
      {selectedRecipe && (
        <RecipeModal 
          recipe={selectedRecipe} 
          onClose={() => setSelectedRecipe(null)} 
          onBookmarkClick={(recipe) => setRecipeToBookmark(recipe)}
          onSimilarClick={(recipePreview) => handleRecipeClick(recipePreview)}
        />
      )}

      {/* 4. Render the Bookmark Modal */}
      {recipeToBookmark && (
        <BookmarkModal
          isOpen={!!recipeToBookmark}
          onClose={() => setRecipeToBookmark(null)}
          recipeId={Number(recipeToBookmark.id)} 
          recipeName={recipeToBookmark.name}
        />
      )}
    </div>
  );
};