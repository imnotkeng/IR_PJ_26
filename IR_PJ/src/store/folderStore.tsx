import { create } from 'zustand';
import { folderService, type Folder } from '@/service/folderService'; 

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
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to load folders', 
        isLoading: false 
      });
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
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to create folder', 
        isLoading: false 
      });
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
    } catch (error: any) {
      set({ 
        error: error.response?.data?.detail || 'Failed to delete folder', 
        isLoading: false 
      });
    }
  }
}));