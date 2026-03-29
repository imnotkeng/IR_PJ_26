// service/folderService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { folderService } from './folderService';
import axios from 'axios';

// Mock the default axios module
vi.mock('axios');

describe('folderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getFolders should fetch folders using the correct URL and params', async () => {
    const mockFolders = [{ id: 1, name: 'Dinner' }];
    (axios.get as any).mockResolvedValue({ data: mockFolders });

    const result = await folderService.getFolders(5);

    // Checks if the correct URL structure is used
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/api/folders?user_id=5'));
    expect(result).toEqual(mockFolders);
  });

  it('createFolder should POST new folder data', async () => {
    const mockFolder = { id: 2, name: 'Desserts', user_id: 5 };
    (axios.post as any).mockResolvedValue({ data: mockFolder });

    const result = await folderService.createFolder('Desserts', 5);

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/folders'),
      { name: 'Desserts', user_id: 5 }
    );
    expect(result).toEqual(mockFolder);
  });

  it('deleteFolder should send a DELETE request', async () => {
    (axios.delete as any).mockResolvedValue({});

    await folderService.deleteFolder(10);

    expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/api/folders/10'));
  });
});