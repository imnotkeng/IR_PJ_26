// service/searchService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
// ย้าย import ลงมานิดนึงเพื่อให้เห็นภาพชัดเจน
import { searchRecipesApi, getSpellSuggestionApi } from './searchService';

// 1. ใช้ vi.hoisted() เพื่อบังคับให้สร้างฟังก์ชันนี้ "ก่อน" ที่ vi.mock จะทำงาน
const { mockGet } = vi.hoisted(() => {
  return { mockGet: vi.fn() };
});

// 2. ตอนนี้ vi.mock จะรู้จัก mockGet แล้ว!
vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => ({
        get: mockGet,
      })),
    },
  };
});

describe('searchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('searchRecipesApi should call /search endpoint with correct query', async () => {
    const mockResponse = { results: [], total: 0 };
    mockGet.mockResolvedValue({ data: mockResponse });

    const result = await searchRecipesApi('chicken');

    expect(mockGet).toHaveBeenCalledWith('/search', { params: { q: 'chicken' } });
    expect(result).toEqual(mockResponse);
  });

  it('getSpellSuggestionApi should extract and return just the suggestion string', async () => {
    const mockResponse = { suggestion: 'garlic' };
    mockGet.mockResolvedValue({ data: mockResponse });

    const result = await getSpellSuggestionApi('garlik');

    expect(mockGet).toHaveBeenCalledWith('/api/suggest', { params: { q: 'garlik' } });
    
    // Notice how it should return just the string, not the whole object
    expect(result).toBe('garlic'); 
  });
});