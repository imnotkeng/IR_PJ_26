import { useSearchStore } from '../store/searchStore';
import { searchRecipesApi } from '../service/searchService'; 

export const useSearch = () => {
  const { query, setQuery, setResults, setIsLoading, setSuggestion } = useSearchStore();

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    
    if (!searchQuery.trim()) {
      setResults([]);
      setSuggestion(null);
      return;
    }

    setIsLoading(true);
    try {
      const data = await searchRecipesApi(searchQuery);
      setResults(data.results);
      setSuggestion(data.suggestion); 
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptSuggestion = () => {
    const suggestion = useSearchStore.getState().suggestion;
    if (suggestion) {
      handleSearch(suggestion);
    }
  };

  return { handleSearch, acceptSuggestion };
};