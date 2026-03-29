// service/bookmarkService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bookmarkService } from './bookmarkService';
import { apiClient } from './apiClient';

// Mock the apiClient completely
vi.mock('./apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('bookmarkService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getUserBookmarks should fetch bookmarks for a user', async () => {
    const mockBookmarks = [{ id: 1, recipe_id: 100 }];
    // Simulate a successful API response
    (apiClient.get as any).mockResolvedValue({ data: mockBookmarks });

    const result = await bookmarkService.getUserBookmarks(10);

    expect(apiClient.get).toHaveBeenCalledWith('/api/bookmarks/10');
    expect(result).toEqual(mockBookmarks);
  });

  it('createBookmark should send POST request with correct data', async () => {
    const newBookmark = { user_id: 1, folder_id: 2, recipe_id: 3, rating: 5 };
    const createdBookmark = { id: 99, ...newBookmark };
    
    (apiClient.post as any).mockResolvedValue({ data: createdBookmark });

    const result = await bookmarkService.createBookmark(newBookmark);

    expect(apiClient.post).toHaveBeenCalledWith('/api/bookmarks', newBookmark);
    expect(result).toEqual(createdBookmark);
  });

  it('deleteBookmark should send DELETE request', async () => {
    (apiClient.delete as any).mockResolvedValue({});

    await bookmarkService.deleteBookmark(99);

    expect(apiClient.delete).toHaveBeenCalledWith('/api/bookmarks/99');
  });

  it('getFolderBookmarks should fetch bookmarks for a specific folder', async () => {
    const mockBookmarks = [{ id: 1, folder_id: 2, recipe_id: 100 }];
    (apiClient.get as any).mockResolvedValue({ data: mockBookmarks });

    const result = await bookmarkService.getFolderBookmarks(2);

    expect(apiClient.get).toHaveBeenCalledWith('/api/bookmarks/folder/2');
    expect(result).toEqual(mockBookmarks);
  });
});