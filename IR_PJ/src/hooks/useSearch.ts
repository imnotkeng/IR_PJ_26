import { useSearchStore } from '../store/searchStore';
import { searchRecipesApi, getSpellSuggestionApi} from '../service/searchService'; 

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

  const fetchSuggestion = async (query: string) => {
    try {
      const suggestion = await getSpellSuggestionApi(query);
      setSuggestion(suggestion);
    } catch (error) {
      console.error("Failed to fetch suggestion");
    }
  };

const acceptSuggestion = (text: string) => {
  handleSearch(text);
  useSearchStore.getState().setSuggestion(null);
};

 return { handleSearch, fetchSuggestion, acceptSuggestion };
};