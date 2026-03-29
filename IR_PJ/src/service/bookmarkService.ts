import { apiClient } from './apiClient'; 
import type { Bookmark } from '@/types/recipe';



const ENDPOINT = '/api/bookmarks'; 

export const bookmarkService = {
  getUserBookmarks: async (userId: number): Promise<Bookmark[]> => {
    const response = await apiClient.get<Bookmark[]>(`${ENDPOINT}/${userId}`);
    return response.data;
  },

  createBookmark: async (data: { user_id: number; folder_id: number; recipe_id: number; rating: number }): Promise<Bookmark> => {
    const response = await apiClient.post<Bookmark>(ENDPOINT, data);
    return response.data;
  },

  getFolderBookmarks: async (folderId: number): Promise<Bookmark[]> => {
    const response = await apiClient.get<Bookmark[]>(`${ENDPOINT}/folder/${folderId}`);
    return response.data;
  },

  deleteBookmark: async (bookmarkId: number): Promise<void> => {
    await apiClient.delete(`${ENDPOINT}/${bookmarkId}`);
  },
};