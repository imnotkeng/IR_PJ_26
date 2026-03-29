// SearchResultsPage.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SearchResultsPage } from './SearchResultsPage';
import { useSearchStore } from '@/store/searchStore';
import { useSearch } from '@/hooks/useSearch';
import { useSearchParams } from 'react-router-dom';

// 1. Mock React Router
const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams('');

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams],
}));

// 2. Mock Custom Hook (useSearch)
const mockHandleSearch = vi.fn();
const mockAcceptSuggestion = vi.fn();
const mockFetchSuggestion = vi.fn();

vi.mock('@/hooks/useSearch', () => ({
  useSearch: () => ({
    handleSearch: mockHandleSearch,
    acceptSuggestion: mockAcceptSuggestion,
    fetchSuggestion: mockFetchSuggestion,
  }),
}));

// 3. Mock Zustand Store
const mockSetSuggestion = vi.fn();
vi.mock('@/store/searchStore', () => ({
  useSearchStore: vi.fn(),
}));

// Add getState mock for useSearchStore.getState().setSuggestion(null)
(useSearchStore as any).getState = vi.fn(() => ({
  setSuggestion: mockSetSuggestion,
}));

// 4. Mock UI Components (To isolate logic testing)
vi.mock('@/components/RecipeCard', () => ({
  RecipeCard: ({ recipe, onClick, onBookmarkClick }: any) => (
    <div data-testid={`recipe-card-${recipe.id}`}>
      {recipe.name}
      <button onClick={() => onClick(recipe)}>Open Recipe</button>
      <button onClick={() => onBookmarkClick(recipe)}>Bookmark Card</button>
    </div>
  ),
}));

vi.mock('@/components/RecipeModal', () => ({
  RecipeModal: ({ recipe, onClose, onBookmarkClick }: any) => (
    <div data-testid="recipe-modal">
      {recipe.name}
      <button onClick={onClose}>Close Recipe Modal</button>
      <button onClick={() => onBookmarkClick(recipe)}>Bookmark from Modal</button>
    </div>
  ),
}));

vi.mock('@/components/BookmarkModal', () => ({
  default: ({ isOpen, onClose }: any) => isOpen ? (
    <div data-testid="bookmark-modal">
      <button onClick={onClose}>Close Bookmark Modal</button>
    </div>
  ) : null,
}));

vi.mock('@/components/SearchSuggestion', () => ({
  SearchSuggestion: ({ visible, onAccept, suggestion }: any) => visible ? (
    <button data-testid="suggestion-btn" onClick={() => onAccept(suggestion)}>
      Accept Suggestion
    </button>
  ) : null,
}));

describe('SearchResultsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams('');
    
    // 🌟 FIXED: MOCK INTERSECTION OBSERVER AS A CLASS 🌟
    const mockIntersectionObserver = vi.fn();
    mockIntersectionObserver.prototype.observe = vi.fn();
    mockIntersectionObserver.prototype.unobserve = vi.fn();
    mockIntersectionObserver.prototype.disconnect = vi.fn();
    window.IntersectionObserver = mockIntersectionObserver as any;
    // 🌟 END OF BLOCK 🌟

    // Default Store State
    vi.mocked(useSearchStore).mockReturnValue({
      results: [],
      isLoading: false,
      suggestion: null,
    } as any);

    // Enable Fake Timers for debounce testing
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ==========================================
  // INITIAL RENDER & SEARCH TRIGGER
  // ==========================================
  it('triggers search automatically if URL has a query', () => {
    mockSearchParams = new URLSearchParams('?q=chicken');
    
    render(<SearchResultsPage />);

    // handleSearch should be called immediately because of the useEffect
    expect(mockHandleSearch).toHaveBeenCalledWith('chicken');
  });

  it('displays loading state correctly', () => {
    vi.mocked(useSearchStore).mockReturnValue({
      results: [],
      isLoading: true, // Force loading state
      suggestion: null,
    } as any);

    render(<SearchResultsPage />);
    expect(screen.getByText('Loading amazing dishes...')).toBeInTheDocument();
  });

  it('displays search results correctly', () => {
    mockSearchParams = new URLSearchParams('?q=beef');
    vi.mocked(useSearchStore).mockReturnValue({
      results: [{ id: 1, name: 'Beef Stew' }, { id: 2, name: 'Beef Tacos' }],
      isLoading: false,
      suggestion: null,
    } as any);

    render(<SearchResultsPage />);

    expect(screen.getByText('Search Results for "beef"')).toBeInTheDocument();
    expect(screen.getByText('Found 2 amazing recipes')).toBeInTheDocument();
    expect(screen.getByText('Beef Stew')).toBeInTheDocument();
  });

  // ==========================================
  // INPUT & DEBOUNCE LOGIC
  // ==========================================
  it('fetches suggestions after typing with debounce', () => {
    render(<SearchResultsPage />);
    
    const input = screen.getByPlaceholderText('Search recipes...');
    
    // Type a word
    fireEvent.change(input, { target: { value: 'pork' } });
    
    // Fast-forward time by 400ms to trigger debounce
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(mockFetchSuggestion).toHaveBeenCalledWith('pork');
  });

  it('clears suggestions if input length is less than 2', () => {
    render(<SearchResultsPage />);
    
    const input = screen.getByPlaceholderText('Search recipes...');
    
    // Type only 1 letter
    fireEvent.change(input, { target: { value: 'a' } });
    
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(mockSetSuggestion).toHaveBeenCalledWith(null);
    expect(mockFetchSuggestion).not.toHaveBeenCalled();
  });

  it('submits a new search and updates the URL', () => {
    render(<SearchResultsPage />);
    
    const input = screen.getByPlaceholderText('Search recipes...');
    fireEvent.change(input, { target: { value: 'fish' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(mockNavigate).toHaveBeenCalledWith('/search?q=fish');
  });

  // ==========================================
  // SUGGESTION DROPDOWN INTERACTIONS
  // ==========================================
  it('accepts a suggestion and navigates', () => {
    vi.mocked(useSearchStore).mockReturnValue({
      results: [],
      isLoading: false,
      suggestion: 'garlic chicken', // Mock a suggestion existing
    } as any);

    render(<SearchResultsPage />);
    
    const input = screen.getByPlaceholderText('Search recipes...');
    fireEvent.focus(input); // Trigger isFocused = true
    fireEvent.change(input, { target: { value: 'garl' } }); // Type to show dropdown
    
    const suggestionBtn = screen.getByTestId('suggestion-btn');
    fireEvent.click(suggestionBtn);

    // Verify it updates everything
    expect(mockNavigate).toHaveBeenCalledWith('/search?q=garlic%20chicken');
    expect(mockAcceptSuggestion).toHaveBeenCalledWith('garlic chicken');
  });

  it('hides dropdown on blur after delay', () => {
    render(<SearchResultsPage />);
    
    const input = screen.getByPlaceholderText('Search recipes...');
    fireEvent.focus(input);
    fireEvent.blur(input);

    // Fast-forward the 150ms timeout inside onBlur
    act(() => {
      vi.advanceTimersByTime(150);
    });
    
    // The suggestion component should no longer be visible
    expect(screen.queryByTestId('suggestion-btn')).not.toBeInTheDocument();
  });

  // ==========================================
  // MODAL INTERACTIONS (RECIPE & BOOKMARK)
  // ==========================================
  it('opens and closes the RecipeModal', () => {
    vi.mocked(useSearchStore).mockReturnValue({
      results: [{ id: 1, name: 'Spicy Noodle' }],
      isLoading: false,
      suggestion: null,
    } as any);

    render(<SearchResultsPage />);

    // Open Recipe
    fireEvent.click(screen.getByText('Open Recipe'));
    expect(screen.getByTestId('recipe-modal')).toBeInTheDocument();

    // Close Recipe
    fireEvent.click(screen.getByText('Close Recipe Modal'));
    expect(screen.queryByTestId('recipe-modal')).not.toBeInTheDocument();
  });

  it('opens and closes the BookmarkModal from the Card', () => {
    vi.mocked(useSearchStore).mockReturnValue({
      results: [{ id: 1, name: 'Spicy Noodle' }],
      isLoading: false,
      suggestion: null,
    } as any);

    render(<SearchResultsPage />);

    // Click Bookmark on the Card
    fireEvent.click(screen.getByText('Bookmark Card'));
    expect(screen.getByTestId('bookmark-modal')).toBeInTheDocument();

    // Close Bookmark Modal
    fireEvent.click(screen.getByText('Close Bookmark Modal'));
    expect(screen.queryByTestId('bookmark-modal')).not.toBeInTheDocument();
  });

  it('opens the BookmarkModal from inside the RecipeModal', () => {
    vi.mocked(useSearchStore).mockReturnValue({
      results: [{ id: 1, name: 'Spicy Noodle' }],
      isLoading: false,
      suggestion: null,
    } as any);

    render(<SearchResultsPage />);

    // 1. Open Recipe Modal first
    fireEvent.click(screen.getByText('Open Recipe'));
    
    // 2. Click Bookmark inside the Recipe Modal
    fireEvent.click(screen.getByText('Bookmark from Modal'));
    
    // 3. Verify Bookmark Modal is now open
    expect(screen.getByTestId('bookmark-modal')).toBeInTheDocument();
  });
});