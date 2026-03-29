// store/folderStore.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFolderStore } from './folderStore';
import { folderService } from '@/service/folderService';

// Mock the folderService so we don't make real API requests
vi.mock('@/service/folderService', () => ({
  folderService: {
    getFolders: vi.fn(),
    createFolder: vi.fn(),
    deleteFolder: vi.fn(),
  },
}));

describe('folderStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFolderStore.setState({ folders: [], isLoading: false, error: null });
  });

  it('fetchFolders should load data and update the store', async () => {
    const mockFolders = [{ id: 1, name: 'Dinner', user_id: 10, created_at: '' }];
    (folderService.getFolders as any).mockResolvedValue(mockFolders);

    // Call the action
    await useFolderStore.getState().fetchFolders(10);

    // Check if the state updated correctly
    expect(folderService.getFolders).toHaveBeenCalledWith(10);
    expect(useFolderStore.getState().folders).toEqual(mockFolders);
    expect(useFolderStore.getState().isLoading).toBe(false);
  });

  it('addFolder should create a folder and append it to the list', async () => {
    const newFolder = { id: 2, name: 'Desserts', user_id: 10, created_at: '' };
    (folderService.createFolder as any).mockResolvedValue(newFolder);

    await useFolderStore.getState().addFolder('Desserts', 10);

    expect(folderService.createFolder).toHaveBeenCalledWith('Desserts', 10);
    // The new folder should now be in the Zustand state array
    expect(useFolderStore.getState().folders).toContainEqual(newFolder);
  });

  it('deleteFolder should remove the folder from the state', async () => {
    // 1. Pre-fill the store with a fake folder
    useFolderStore.setState({
      folders: [{ id: 99, name: 'To Delete', user_id: 10, created_at: '' }]
    });

    // 2. Mock the successful deletion
    (folderService.deleteFolder as any).mockResolvedValue({});

    // 3. Call delete
    await useFolderStore.getState().deleteFolder(99);

    // 4. Verify the folder is gone from the array
    expect(folderService.deleteFolder).toHaveBeenCalledWith(99);
    expect(useFolderStore.getState().folders).toHaveLength(0);
  });

  it('fetchFolders should handle API errors and update error state', async () => {
    // Simulate an Axios error returning from the backend
    const axiosError = { 
      isAxiosError: true, 
      response: { data: { detail: 'Custom folder error' } } 
    };
    (folderService.getFolders as any).mockRejectedValue(axiosError);

    await useFolderStore.getState().fetchFolders(10);

    expect(useFolderStore.getState().error).toBe('Custom folder error');
    expect(useFolderStore.getState().isLoading).toBe(false);
  });

  it('addFolder should handle non-Axios network crashes', async () => {
    // Simulate a standard network error (not from Axios)
    (folderService.createFolder as any).mockRejectedValue(new Error('Network down'));

    await useFolderStore.getState().addFolder('Test', 10);

    expect(useFolderStore.getState().error).toBe('Failed to create folder');
    expect(useFolderStore.getState().isLoading).toBe(false);
  });
  
  it('deleteFolder should handle API errors and update error state', async () => {
    // Simulate an Axios error returning from the backend
    const axiosError = { 
      isAxiosError: true, 
      response: { data: { detail: 'Cannot delete this folder' } } 
    };
    (folderService.deleteFolder as any).mockRejectedValue(axiosError);

    await useFolderStore.getState().deleteFolder(99);

    expect(useFolderStore.getState().error).toBe('Cannot delete this folder');
    expect(useFolderStore.getState().isLoading).toBe(false);
  });
});