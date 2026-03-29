import axios from 'axios';

// Update this if you use a central axios instance or different route prefix
const API_URL = 'http://127.0.0.1:5001/api/folders';

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
    const response = await axios.get<Folder[]>(`${API_URL}?user_id=${userId}`);
    return response.data;
  },

  /**
   * Create a new folder
   */
  createFolder: async (name: string, userId: number): Promise<Folder> => {
    const response = await axios.post<Folder>(API_URL, {
      name: name,
      user_id: userId,
    });
    return response.data;
  },

  /**
   * Delete a folder by ID
   */
  deleteFolder: async (folderId: number): Promise<void> => {
    await axios.delete(`${API_URL}/${folderId}`);
  }
};