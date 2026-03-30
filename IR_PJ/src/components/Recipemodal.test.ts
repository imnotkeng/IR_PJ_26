import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import { RecipeModal } from './RecipeModal';
import { apiClient } from '@/service/apiClient';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/utils', () => ({
  formatDuration: (minutes: number) => `${minutes} min`,
}));

vi.mock('@/service/apiClient', () => ({
  apiClient: { get: vi.fn() },
}));

const mockApiGet = vi.mocked(apiClient.get);

// ---------------------------------------------------------------------------
// Fixtures & local types (no import-type syntax)
// ---------------------------------------------------------------------------

type SimilarRecipe = {
  id: number;
  name: string;
  image_url: string;
  minutes: number;
};

type TestRecipe = {
  id: number | undefined;
  name: string;
  image_url: string;
  minutes: number;
  ingredients: string;
  steps: string;
  reasons: string[] | undefined;
};

type ModalOverrides = {
  recipe?: TestRecipe;
  onClose?: () => void;
  onBookmarkClick?: (recipe: TestRecipe) => void;
  onSimilarClick?: (recipe: SimilarRecipe) => void;
};

const baseRecipe: TestRecipe = {
  id: 42,
  name: 'Spaghetti Carbonara',
  image_url: 'https://example.com/carbonara.jpg',
  minutes: 30,
  ingredients: 'Pasta, Eggs, Pancetta, Pecorino Romano, Black Pepper',
  steps: '<ol><li>Boil pasta.</li><li>Mix eggs and cheese.</li><li>Combine.</li></ol>',
  reasons: ['High protein', 'Quick to make', 'Budget-friendly'],
};

const similarRecipes: SimilarRecipe[] = [
  { id: 1, name: 'Cacio e Pepe',      image_url: 'https://example.com/cacio.jpg',       minutes: 20 },
  { id: 2, name: 'Pasta Amatriciana', image_url: 'https://example.com/amatriciana.jpg', minutes: 25 },
];

const defaultProps: Required<ModalOverrides> = {
  recipe:          baseRecipe,
  onClose:         vi.fn(),
  onBookmarkClick: vi.fn(),
  onSimilarClick:  vi.fn(),
};

// Typed helper — avoids the props={} -> boolean-inference bug on render()
function renderModal(overrides: ModalOverrides = {}) {
  const merged = { ...defaultProps, ...overrides };
  return render(
    createElement(RecipeModal, merged as Parameters<typeof RecipeModal>[0])
  );
}

// ---------------------------------------------------------------------------
// Unit Tests — Rendering
// ---------------------------------------------------------------------------

describe('RecipeModal — rendering', () => {
  beforeEach(() => { mockApiGet.mockResolvedValue({ data: similarRecipes }); });
  afterEach(() => vi.clearAllMocks());

  it('renders the recipe name as the hero heading', () => {
    renderModal();
    expect(screen.getByRole('heading', { name: /spaghetti carbonara/i })).toBeInTheDocument();
  });

  it('renders the hero image with correct src and alt', () => {
    renderModal();
    expect(screen.getByAltText(/spaghetti carbonara/i)).toHaveAttribute('src', baseRecipe.image_url);
  });

  it('renders the formatted cook time badge', () => {
    renderModal();
    expect(screen.getByText('30 min')).toBeInTheDocument();
  });

  it('renders the Ingredients section with content', () => {
    renderModal();
    expect(screen.getByText(/^ingredients$/i)).toBeInTheDocument();
    expect(screen.getByText(baseRecipe.ingredients)).toBeInTheDocument();
  });

  it('renders the Instructions section via dangerouslySetInnerHTML', () => {
    renderModal();
    expect(screen.getByText(/^instructions$/i)).toBeInTheDocument();
    expect(screen.getByText(/boil pasta/i)).toBeInTheDocument();
  });

  it('falls back to "Instructions not available." when steps is empty', () => {
    renderModal({ recipe: { ...baseRecipe, steps: '' } });
    expect(screen.getByText(/instructions not available/i)).toBeInTheDocument();
  });

  it('renders the Save and Close action buttons', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /✕/ })).toBeInTheDocument();
  });

  it('renders the "Why we recommend" section when reasons are present', () => {
    renderModal();
    expect(screen.getByText(/why we recommend this for you/i)).toBeInTheDocument();
    baseRecipe.reasons!.forEach((r) => expect(screen.getByText(r)).toBeInTheDocument());
  });

  it('hides the "Why we recommend" section when reasons is empty', () => {
    renderModal({ recipe: { ...baseRecipe, reasons: [] } });
    expect(screen.queryByText(/why we recommend/i)).not.toBeInTheDocument();
  });

  it('hides the "Why we recommend" section when reasons is undefined', () => {
    renderModal({ recipe: { ...baseRecipe, reasons: undefined } });
    expect(screen.queryByText(/why we recommend/i)).not.toBeInTheDocument();
  });

  it('shows a loading state while the similar-recipes fetch is in flight', () => {
    mockApiGet.mockReturnValue(new Promise(() => {}));
    renderModal();
    expect(screen.getByText(/finding similar recipes/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Unit Tests — Similar Recipes
// ---------------------------------------------------------------------------

describe('RecipeModal — similar recipes', () => {
  afterEach(() => vi.clearAllMocks());

  it('calls the correct endpoint on mount', async () => {
    mockApiGet.mockResolvedValue({ data: similarRecipes });
    renderModal();
    await waitFor(() =>
      expect(mockApiGet).toHaveBeenCalledWith(`/api/recipes/${baseRecipe.id}/similar`)
    );
  });

  it('renders similar recipe cards after a successful fetch', async () => {
    mockApiGet.mockResolvedValue({ data: similarRecipes });
    renderModal();
    await waitFor(() => {
      expect(screen.getByText('Cacio e Pepe')).toBeInTheDocument();
      expect(screen.getByText('Pasta Amatriciana')).toBeInTheDocument();
    });
  });

  it('renders the formatted duration for each similar recipe', async () => {
    mockApiGet.mockResolvedValue({ data: similarRecipes });
    renderModal();
    await waitFor(() => {
      expect(screen.getByText('20 min')).toBeInTheDocument();
      expect(screen.getByText('25 min')).toBeInTheDocument();
    });
  });

  it('shows "No similar recipes found." when the API returns an empty array', async () => {
    mockApiGet.mockResolvedValue({ data: [] });
    renderModal();
    await waitFor(() =>
      expect(screen.getByText(/no similar recipes found/i)).toBeInTheDocument()
    );
  });

  it('shows "No similar recipes found." when the API call fails', async () => {
    mockApiGet.mockRejectedValue(new Error('Network error'));
    renderModal();
    await waitFor(() =>
      expect(screen.getByText(/no similar recipes found/i)).toBeInTheDocument()
    );
  });

  it('skips the fetch when recipe has no id', () => {
    mockApiGet.mockResolvedValue({ data: [] });
    renderModal({ recipe: { ...baseRecipe, id: undefined } });
    expect(mockApiGet).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Unit Tests — Callbacks
// ---------------------------------------------------------------------------

describe('RecipeModal — callbacks', () => {
  beforeEach(() => { mockApiGet.mockResolvedValue({ data: similarRecipes }); });
  afterEach(() => vi.clearAllMocks());

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    await userEvent.click(screen.getByRole('button', { name: /✕/ }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onBookmarkClick with the full recipe when Save is clicked', async () => {
    const onBookmarkClick = vi.fn();
    renderModal({ onBookmarkClick });
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onBookmarkClick).toHaveBeenCalledTimes(1);
    expect(onBookmarkClick).toHaveBeenCalledWith(baseRecipe);
  });

  it('calls onSimilarClick with the correct recipe when a card is clicked', async () => {
    const onSimilarClick = vi.fn();
    renderModal({ onSimilarClick });
    const title = await screen.findByText('Cacio e Pepe');
    const card = title.closest('div.cursor-pointer') ?? title.parentElement!;
    fireEvent.click(card);
    expect(onSimilarClick).toHaveBeenCalledTimes(1);
    expect(onSimilarClick).toHaveBeenCalledWith(similarRecipes[0]);
  });

  it('does not throw when onSimilarClick is omitted and a card is clicked', async () => {
    renderModal({ onSimilarClick: undefined });
    const card = await screen.findByText('Cacio e Pepe');
    expect(() => fireEvent.click(card)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Unit Tests — Image Error Fallbacks
// ---------------------------------------------------------------------------

describe('RecipeModal — image error fallbacks', () => {
  beforeEach(() => { mockApiGet.mockResolvedValue({ data: similarRecipes }); });
  afterEach(() => vi.clearAllMocks());

  it('replaces the hero image with a placeholder on error', () => {
    renderModal();
    const img = screen.getByAltText(/spaghetti carbonara/i);
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', 'https://placehold.co/1000x600?text=No+Image');
  });

  it('replaces a similar-recipe image with a placeholder on error', async () => {
    renderModal();
    const img = await screen.findByAltText('Cacio e Pepe');
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', 'https://placehold.co/300x200?text=No+Image');
  });
});

// ---------------------------------------------------------------------------
// Integration Tests
// ---------------------------------------------------------------------------

describe('RecipeModal — integration: recipe change', () => {
  afterEach(() => vi.clearAllMocks());

  it('re-fetches with the new endpoint when recipe.id changes', async () => {
    mockApiGet.mockResolvedValue({ data: similarRecipes });
    const { rerender } = renderModal();
    await waitFor(() => expect(mockApiGet).toHaveBeenCalledTimes(1));

    const newRecipe = { ...baseRecipe, id: 99, name: 'Risotto' };
    rerender(
      createElement(RecipeModal, { ...defaultProps, recipe: newRecipe } as Parameters<typeof RecipeModal>[0])
    );

    await waitFor(() => expect(mockApiGet).toHaveBeenCalledTimes(2));
    expect(mockApiGet).toHaveBeenLastCalledWith('/api/recipes/99/similar');
  });

  it('resets scroll to top when recipe.id changes', async () => {
    mockApiGet.mockResolvedValue({ data: [] });

    const scrollToMock = vi.fn();
    const div = document.createElement('div');
    div.id = 'modal-scroll-area';
    div.scrollTo = scrollToMock;
    document.body.appendChild(div);

    const { rerender } = renderModal();
    rerender(
      createElement(RecipeModal, { ...defaultProps, recipe: { ...baseRecipe, id: 77 } } as Parameters<typeof RecipeModal>[0])
    );

    await waitFor(() =>
      expect(scrollToMock).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
    );
    document.body.removeChild(div);
  });
});

describe('RecipeModal — integration: full happy-path', () => {
  it('renders all major sections correctly end-to-end', async () => {
    mockApiGet.mockResolvedValue({ data: similarRecipes });
    renderModal();

    // Sync content visible immediately
    expect(screen.getByRole('heading', { name: /spaghetti carbonara/i })).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
    expect(screen.getByText(baseRecipe.ingredients)).toBeInTheDocument();
    expect(screen.getByText(/why we recommend/i)).toBeInTheDocument();

    // Async: similar recipe cards appear after fetch
    await waitFor(() => {
      expect(screen.getByText('Cacio e Pepe')).toBeInTheDocument();
      expect(screen.getByText('Pasta Amatriciana')).toBeInTheDocument();
    });

    // No stale loading/error states
    expect(screen.queryByText(/no similar recipes found/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/finding similar recipes/i)).not.toBeInTheDocument();
  });

  it('user can save a recipe then close the modal', async () => {
    mockApiGet.mockResolvedValue({ data: [] });
    const onBookmarkClick = vi.fn();
    const onClose = vi.fn();
    renderModal({ onBookmarkClick, onClose });

    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(onBookmarkClick).toHaveBeenCalledWith(baseRecipe);

    await userEvent.click(screen.getByRole('button', { name: /✕/ }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});