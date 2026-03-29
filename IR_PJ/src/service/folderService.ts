import axios from 'axios';
import { API_URL } from '../config';

// 🌟 FIX: Renamed to FOLDER_API_URL and used template literals (backticks)
const FOLDER_API_URL = `${API_URL}/api/folders`;

// 1. MUST EXPORT the interface so other files can use it
export interface Folder {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
}

export const folderService = {
  /**
   * Fetch all folders for a specific user
   */
  getFolders: async (userId: number): Promise<Folder[]> => {
    // 🌟 FIX: Use the new variable
    const response = await axios.get<Folder[]>(`${FOLDER_API_URL}?user_id=${userId}`);
    return response.data;
  },

  /**
   * Create a new folder
   */
  createFolder: async (name: string, userId: number): Promise<Folder> => {
    // 🌟 FIX: Use the new variable
    const response = await axios.post<Folder>(FOLDER_API_URL, {
      name: name,
      user_id: userId,
    });
    return response.data;
  },

  /**
   * Delete a folder by ID
   */
  deleteFolder: async (folderId: number): Promise<void> => {
    // 🌟 FIX: Use the new variable
    await axios.delete(`${FOLDER_API_URL}/${folderId}`);
  }
};