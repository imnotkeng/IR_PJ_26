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

  const fetchSuggestion = async (q: string) => {
  if (!q || q.trim().length < 2) {
    useSearchStore.getState().setSuggestion(null);
    return;
  }
  try {
    const res = await fetch(`/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    useSearchStore.getState().setSuggestion(data.suggestion ?? null);
  } catch {
    useSearchStore.getState().setSuggestion(null);
  }
};

const acceptSuggestion = (text: string) => {
  handleSearch(text);
  useSearchStore.getState().setSuggestion(null);
};

 return { handleSearch, fetchSuggestion, acceptSuggestion };
};