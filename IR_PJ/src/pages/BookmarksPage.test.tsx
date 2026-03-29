// BookmarksPage.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookmarksPage from './BookmarksPage';
import { bookmarkService } from '@/service/bookmarkService';
import { apiClient } from '@/service/apiClient';
import { useAuthStore } from '@/store/authStore';

// 1. Mock React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// 2. Mock Services
vi.mock('@/service/bookmarkService', () => ({
  bookmarkService: {
    getUserBookmarks: vi.fn(),
    deleteBookmark: vi.fn(),
  },
}));

vi.mock('@/service/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

// 3. Mock Zustand Store
vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

// 4. Mock Modals to keep the DOM clean
vi.mock('@/components/RecipeModal', () => ({
  RecipeModal: ({ recipe, onClose }: any) => (
    <div data-testid="recipe-modal">
      <h2>{recipe.name}</h2>
      <button onClick={onClose}>Close Recipe Modal</button>
    </div>
  ),
}));

vi.mock('@/components/BookmarkModal', () => ({
  default: () => <div data-testid="bookmark-modal" />,
}));

describe('BookmarksPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: User is logged in
    vi.mocked(useAuthStore).mockReturnValue({
      user: { id: 1 },
    } as any);

    // Stub global functions
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
    vi.stubGlobal('alert', vi.fn());
    vi.stubGlobal('console', { ...console, error: vi.fn() }); // Hide expected console errors
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ==========================================
  // HAPPY PATH TESTS
  // ==========================================
  it('renders empty state when user has no bookmarks', async () => {
    vi.mocked(bookmarkService.getUserBookmarks).mockResolvedValue([]);

    render(<BookmarksPage />);

    await waitFor(() => {
      expect(screen.getByText('Your vault is empty.')).toBeInTheDocument();
    });

    // Test the discover button
    fireEvent.click(screen.getByText('Discover Recipes'));
    expect(mockNavigate).toHaveBeenCalledWith('/search');
  });

  it('fetches and displays bookmarks with recipe details', async () => {
    const mockBookmarks = [
      // 🌟 ADDED folder_name HERE
      { id: 10, user_id: 1, folder_id: 2, recipe_id: 100, rating: 5, folder_name: 'Dinner', created_at: '2026-01-01' }
    ];
    vi.mocked(bookmarkService.getUserBookmarks).mockResolvedValue(mockBookmarks);
    
    // Mock the recipe details fetch
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { id: 100, name: 'Delicious Pasta', minutes: 45, image_url: 'pasta.jpg' }
    });

    render(<BookmarksPage />);

    // Verify it loads and displays the recipe name and folder name
    await waitFor(() => {
      expect(screen.getByText('Delicious Pasta')).toBeInTheDocument();
      expect(screen.getByText('Dinner')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // Rating
    });
  });

  it('opens the recipe modal when a bookmark card is clicked', async () => {
    const mockBookmarks = [
      // 🌟 ADDED folder_name HERE
      { id: 10, user_id: 1, folder_id: 2, recipe_id: 100, rating: 5, folder_name: 'Dinner', created_at: '2026-01-01' }
    ];
    vi.mocked(bookmarkService.getUserBookmarks).mockResolvedValue(mockBookmarks);
    
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { id: 100, name: 'Delicious Pasta' }
    });

    render(<BookmarksPage />);
    await waitFor(() => expect(screen.getByText('Delicious Pasta')).toBeInTheDocument());

    // Click the card
    fireEvent.click(screen.getByText('Delicious Pasta'));

    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByTestId('recipe-modal')).toBeInTheDocument();
    });
  });

  it('successfully deletes a bookmark', async () => {
    const mockBookmarks = [
      // 🌟 ADDED folder_name HERE
      { id: 10, user_id: 1, folder_id: 2, recipe_id: 100, rating: 5, folder_name: 'Dinner', created_at: '2026-01-01' }
    ];
    vi.mocked(bookmarkService.getUserBookmarks).mockResolvedValue(mockBookmarks);
    vi.mocked(apiClient.get).mockResolvedValue({ data: { id: 100, name: 'Delicious Pasta' } });
    vi.mocked(bookmarkService.deleteBookmark).mockResolvedValue(undefined);

    render(<BookmarksPage />);
    await waitFor(() => expect(screen.getByText('Delicious Pasta')).toBeInTheDocument());

    // Click delete button
    fireEvent.click(screen.getByTitle('Remove bookmark'));

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this bookmark?');
    expect(bookmarkService.deleteBookmark).toHaveBeenCalledWith(10);

    // Verify UI removes the item
    await waitFor(() => {
      expect(screen.queryByText('Delicious Pasta')).not.toBeInTheDocument();
    });
  });

  // ==========================================
  // SAD PATH & EDGE CASE TESTS
  // ==========================================
  it('does nothing if user is not logged in', async () => {
    vi.mocked(useAuthStore).mockReturnValue({ user: null } as any);
    render(<BookmarksPage />);
    
    // getUserBookmarks should never be called if user is missing
    expect(bookmarkService.getUserBookmarks).not.toHaveBeenCalled();
  });

  it('handles main bookmark fetch failure', async () => {
    vi.mocked(bookmarkService.getUserBookmarks).mockRejectedValue(new Error('API Down'));
    render(<BookmarksPage />);

    // Just ensure it doesn't crash and stops loading
    await waitFor(() => {
      expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
    });
  });

  it('handles individual recipe detail fetch failure smoothly', async () => {
    const mockBookmarks = [
      // 🌟 ADDED folder_name HERE
      { id: 10, user_id: 1, folder_id: 2, recipe_id: 999, rating: 4, folder_name: 'Dinner', created_at: '2026-01-01' }
    ];
    vi.mocked(bookmarkService.getUserBookmarks).mockResolvedValue(mockBookmarks);
    
    // Simulate the apiClient failing to find the recipe details
    vi.mocked(apiClient.get).mockRejectedValue(new Error('Recipe not found'));

    render(<BookmarksPage />);

    await waitFor(() => {
      // It should fallback to displaying the default string: `Recipe #${bookmark.recipe_id}`
      expect(screen.getByText('Recipe #999')).toBeInTheDocument();
    });
  });

  it('shows an alert if deleting a bookmark fails', async () => {
    const mockBookmarks = [
      // 🌟 ADDED folder_name HERE
      { id: 10, user_id: 1, folder_id: 2, recipe_id: 100, rating: 5, folder_name: 'Dinner', created_at: '2026-01-01' }
    ];
    vi.mocked(bookmarkService.getUserBookmarks).mockResolvedValue(mockBookmarks);
    vi.mocked(apiClient.get).mockResolvedValue({ data: { id: 100, name: 'Delicious Pasta' } });
    
    // Simulate delete failing
    vi.mocked(bookmarkService.deleteBookmark).mockRejectedValue(new Error('Delete Failed'));

    render(<BookmarksPage />);
    await waitFor(() => expect(screen.getByText('Delicious Pasta')).toBeInTheDocument());

    fireEvent.click(screen.getByTitle('Remove bookmark'));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Could not delete the bookmark. Please try again.');
      // The item should still be on the screen!
      expect(screen.getByText('Delicious Pasta')).toBeInTheDocument();
    });
  });

  it('handles broken image links gracefully using onError', async () => {
    const mockBookmarks = [
      // 🌟 ADDED folder_name HERE
      { id: 10, user_id: 1, folder_id: 2, recipe_id: 100, rating: 5, folder_name: 'Dinner', created_at: '2026-01-01' }
    ];
    vi.mocked(bookmarkService.getUserBookmarks).mockResolvedValue(mockBookmarks);
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { id: 100, name: 'Pasta', image_url: 'bad-link.jpg' }
    });

    render(<BookmarksPage />);
    await waitFor(() => expect(screen.getByText('Pasta')).toBeInTheDocument());

    // Find the image and trigger an error event on it
    const image = screen.getByAltText('Pasta') as HTMLImageElement;
    fireEvent.error(image);

    // Verify the src updated to the fallback placeholder
    expect(image.src).toContain('https://placehold.co/600x400?text=No+Image');
  });
});