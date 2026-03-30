import { create } from 'zustand';
import { folderService, type Folder } from '@/service/folderService'; 
import axios from 'axios';

interface FolderStore {
  folders: Folder[];
  isLoading: boolean;
  error: string | null;
  
  fetchFolders: (userId: number) => Promise<void>;
  addFolder: (name: string, userId: number) => Promise<void>;
  deleteFolder: (id: number) => Promise<void>;
}

export const useFolderStore = create<FolderStore>((set) => ({
  folders: [],
  isLoading: false,
  error: null,

  // Action to get all folders
  fetchFolders: async (userId: number) => {
    set({ isLoading: true, error: null });
    try {
      const data = await folderService.getFolders(userId);
      set({ folders: data, isLoading: false });
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.detail ?? 'Failed to load folders'
        : 'Failed to load folders';
      set({ error: msg, isLoading: false });
}
  },

  // Action to create a new folder
  addFolder: async (name: string, userId: number) => {
    set({ isLoading: true, error: null });
    try {
      const newFolder = await folderService.createFolder(name, userId);
      
      set((state) => ({ 
        folders: [...state.folders, newFolder],
        isLoading: false 
      }));
    } catch (err) {
        const msg = axios.isAxiosError(err)
          ? err.response?.data?.detail ?? 'Failed to create folder'
          : 'Failed to create folder';
        set({ error: msg, isLoading: false });
}
  },

  // Action to delete a folder
  deleteFolder: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await folderService.deleteFolder(id);
      
      set((state) => ({
        folders: state.folders.filter((folder) => folder.id !== id),
        isLoading: false
      }));
    } catch (err) {
  const msg = axios.isAxiosError(err)
    ? err.response?.data?.detail ?? 'Failed to delete folder'
    : 'Failed to delete folder';
  set({ error: msg, isLoading: false });
}
  }
}));