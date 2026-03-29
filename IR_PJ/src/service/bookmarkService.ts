import axios from 'axios';

const API_URL = 'http://127.0.0.1:5001/api/bookmarks';
import type { Recipe } from '@/types/recipe';

export interface Bookmark {
  id: number;
  user_id: number;
  folder_id: number;
  recipe_id: number | string; // ElasticSearch sometimes uses string IDs
  rating: number;
  folder_name: string;
  created_at: string;
  recipe?: Recipe; // 👈 Add this optional property!
}

export const bookmarkService = {
  getUserBookmarks: async (userId: number): Promise<Bookmark[]> => {
    const response = await axios.get<Bookmark[]>(`${API_URL}/${userId}`);
    return response.data;
  },

  createBookmark: async (data: { user_id: number; folder_id: number; recipe_id: number; rating: number }): Promise<Bookmark> => {
    const response = await axios.post<Bookmark>(API_URL, data);
    return response.data;
  },

  getFolderBookmarks: async (folderId: number): Promise<Bookmark[]> => {
    const response = await axios.get<Bookmark[]>(`${API_URL}/folder/${folderId}`);
    return response.data;
  },

  deleteBookmark: async (bookmarkId: number): Promise<void> => {
    await axios.delete(`${API_URL}/${bookmarkId}`);
  },
};