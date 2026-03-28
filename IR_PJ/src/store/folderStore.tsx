import { create } from 'zustand';

// 1. Define the shape of your Folder data
export interface Folder {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
}

// 2. Define the State and Actions for the store
interface FolderStore {
  folders: Folder[];
  isLoading: boolean;
  error: string | null;
  
  // Functions to change the data
  fetchFolders: () => Promise<void>;
  addFolder: (name: string, userId: number) => Promise<void>;
  deleteFolder: (id: number) => Promise<void>;
}

// 3. Create the actual store
export const useFolderStore = create<FolderStore>((set) => ({
  // Initial state
  folders: [],
  isLoading: false,
  error: null,

  // Action to get all folders
  fetchFolders: async () => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with your real API call
      // const response = await fetch('/api/folders');
      // const data = await response.json();
      
      const mockData: Folder[] = [
        { id: 1, user_id: 1, name: 'Spicy Thai', created_at: '2026-03-29T10:00:00Z' },
        { id: 2, user_id: 1, name: 'Desserts', created_at: '2026-03-28T15:30:00Z' }
      ];
      
      set({ folders: mockData, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load folders', isLoading: false });
    }
  },

  // Action to create a new folder
  addFolder: async (name: string, userId: number) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with your real POST API call
      const newFolder: Folder = {
        id: Date.now(), // Fake ID for testing
        user_id: userId,
        name: name,
        created_at: new Date().toISOString(),
      };
      
      // Update the list by adding the new folder at the end
      set((state) => ({ 
        folders: [...state.folders, newFolder],
        isLoading: false 
      }));
    } catch (error) {
      set({ error: 'Failed to create folder', isLoading: false });
    }
  },

  // Action to delete a folder
  deleteFolder: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      // TODO: Replace with your real DELETE API call
      
      // Update the list by filtering out the deleted folder
      set((state) => ({
        folders: state.folders.filter((folder) => folder.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({ error: 'Failed to delete folder', isLoading: false });
    }
  }
}));