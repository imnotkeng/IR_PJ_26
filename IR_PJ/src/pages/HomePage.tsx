import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { SearchBar } from '@/components/searchBar';
import { RecipeCarousel } from '@/components/RecipeCarousel';
import { useAuthStore } from '@/store/authStore';

export const HomePage = () => {
  const { user } = useAuthStore();
  
  const [summaryList, setSummaryList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [categoryName, setCategoryName] = useState("Your Favorites");
  const [randomList, setRandomList] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      setIsLoading(true);
      try {
        // Fetch Random Dishes (Always loads for everyone)
        // const randomRes = await axios.get('http://127.0.0.1:5001/api/recommendations/random');
        const randomRes = await axios.get('http://localhost:5001/api/recommendations/random');
        setRandomList(randomRes.data);

        // Fetch Personal ML Lists if user is logged in
        if (user?.id) {
          // const personalRes = await axios.get(`http://127.0.0.1:5001/api/recommendations/home/${user.id}`);
          const personalRes = await axios.get(`http://localhost:5001/api/recommendations/home/${user.id}`);
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

  console.log("Current User:", user);
  console.log("Summary List:", summaryList);
  console.log("Category List:", categoryList);

  return (
    <div className="bg-slate-50 min-h-screen pb-12 overflow-x-hidden">
      <SearchBar />

      {/* List 1: Summary from all folders (ML) */}
      {user && summaryList.length > 0 && (
        <RecipeCarousel 
          title="Recommended For You" 
          subtitle="Based on everything you have saved"
          recipes={summaryList} 
          isLoading={isLoading} 
        />
      )}

      {/* List 2: Specific Category (ML) */}
      {user && categoryList.length > 0 && (
        <RecipeCarousel 
          title={`Because you like ${categoryName}`} 
          subtitle="Smart suggestions from your folder"
          recipes={categoryList} 
          isLoading={isLoading} 
        />
      )}

      {/* List 3: Completely Random Dishes */}
      <RecipeCarousel 
        title="Discover Something New" 
        subtitle="Random dishes to inspire your next meal"
        recipes={randomList} 
        isLoading={isLoading} 
      />
    </div>
  );
};