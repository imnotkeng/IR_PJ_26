// FolderDetailPage.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FolderDetailPage from './FolderDetailPage';
import { bookmarkService } from '@/service/bookmarkService';
import { apiClient } from '@/service/apiClient';
import { useFolderStore } from '@/store/folderStore';

// 1. Mock React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useParams: () => ({ folderId: '1' }), // จำลองว่าเราอยู่ใน /folders/1
  useNavigate: () => mockNavigate,
}));

// 2. Mock Services
vi.mock('@/service/bookmarkService', () => ({
  bookmarkService: {
    getFolderBookmarks: vi.fn(),
    deleteBookmark: vi.fn(),
  },
}));

vi.mock('@/service/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

// 3. Mock Zustand Store
vi.mock('@/store/folderStore', () => ({
  useFolderStore: vi.fn(),
}));

// 4. Mock Modals (เพื่อไม่ให้ UI ใน Modal มากวนการเทส Component หลัก)
vi.mock('@/components/RecipeModal', () => ({
  RecipeModal: ({ recipe, onClose }: any) => (
    <div data-testid="recipe-modal">
      <h2>{recipe.name}</h2>
      <button onClick={onClose}>Close Modal</button>
    </div>
  ),
}));

vi.mock('@/components/BookmarkModal', () => ({
  default: () => <div data-testid="bookmark-modal" />,
}));

describe('FolderDetailPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // จำลองข้อมูลพื้นฐานใน Zustand Store
    vi.mocked(useFolderStore).mockReturnValue({
      folders: [{ id: 1, name: 'My Favorite Dinners', user_id: 10, created_at: '' }],
    } as any);

    // จำลอง window.confirm และ window.alert
    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
    vi.stubGlobal('alert', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders empty state when there are no bookmarks', async () => {
    // กำหนดให้ไม่มี Bookmarks
    vi.mocked(bookmarkService.getFolderBookmarks).mockResolvedValue([]);

    render(<FolderDetailPage />);

    // ตรวจสอบ Loading state
    expect(screen.getByText('Opening folder...')).toBeInTheDocument();

    // รอให้ Loading หายไปและแสดงหน้า Empty
    await waitFor(() => {
      expect(screen.getByText('This folder is empty.')).toBeInTheDocument();
      expect(screen.getByText('My Favorite Dinners')).toBeInTheDocument();
    });

    // เทสปุ่ม Discover Recipes
    fireEvent.click(screen.getByText('Discover Recipes'));
    expect(mockNavigate).toHaveBeenCalledWith('/search');
  });

  it('renders bookmarks and fetches their recipe details', async () => {
    const mockBookmarks = [{ id: 10, folder_id: 1, recipe_id: 100, rating: 5, created_at: '2026-01-01' }];
    vi.mocked(bookmarkService.getFolderBookmarks).mockResolvedValue(mockBookmarks);

    // กำหนดให้ apiClient.get คืนค่าข้อมูลสูตรอาหารเมื่อถูกเรียกด้วย ID 100
    vi.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url.includes('/api/recipes/100')) {
        return { data: { id: 100, name: 'Spicy Chicken', minutes: 30 } };
      }
      return { data: {} };
    });

    render(<FolderDetailPage />);

    await waitFor(() => {
      // ตรวจสอบว่ามีชื่อสูตรอาหารแสดงขึ้นมา
      expect(screen.getByText('Spicy Chicken')).toBeInTheDocument();
      // เช็คการแสดง Rating
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('handles deleting a bookmark', async () => {
    const mockBookmarks = [{ id: 10, folder_id: 1, recipe_id: 100, rating: 5, created_at: '2026-01-01' }];
    vi.mocked(bookmarkService.getFolderBookmarks).mockResolvedValue(mockBookmarks);
    vi.mocked(apiClient.get).mockResolvedValue({ data: { id: 100, name: 'Spicy Chicken' } });
    
    // จำลองให้ลบสำเร็จ
    vi.mocked(bookmarkService.deleteBookmark).mockResolvedValue(undefined);

    render(<FolderDetailPage />);

    // รอให้ Render เสร็จ
    await waitFor(() => expect(screen.getByText('Spicy Chicken')).toBeInTheDocument());

    // กดปุ่มลบ (Trash icon)
    const deleteBtn = screen.getByTitle('Remove from folder');
    fireEvent.click(deleteBtn);

    // ตรวจสอบว่า window.confirm ทำงาน และเรียก API ลบ
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to remove this recipe from the folder?');
    expect(bookmarkService.deleteBookmark).toHaveBeenCalledWith(10);

    // ตรวจสอบว่า UI อัปเดต (Spicy Chicken ต้องหายไป)
    await waitFor(() => {
      expect(screen.queryByText('Spicy Chicken')).not.toBeInTheDocument();
    });
  });

  it('handles errors when deleting a bookmark fails', async () => {
    const mockBookmarks = [{ id: 10, folder_id: 1, recipe_id: 100, rating: 5, created_at: '2026-01-01' }];
    vi.mocked(bookmarkService.getFolderBookmarks).mockResolvedValue(mockBookmarks);
    vi.mocked(apiClient.get).mockResolvedValue({ data: { id: 100, name: 'Spicy Chicken' } });
    
    // บังคับให้การลบพัง!
    vi.mocked(bookmarkService.deleteBookmark).mockRejectedValue(new Error('API Down'));

    render(<FolderDetailPage />);
    await waitFor(() => expect(screen.getByTitle('Remove from folder')).toBeInTheDocument());

    fireEvent.click(screen.getByTitle('Remove from folder'));

    await waitFor(() => {
      // ตรวจสอบว่าแสดง Error Alert ให้ผู้ใช้เห็น
      expect(window.alert).toHaveBeenCalledWith('Could not delete the bookmark. Please try again.');
    });
  });

  it('fetches and displays ML suggestions when requested', async () => {
    const mockBookmarks = [{ id: 10, folder_id: 1, recipe_id: 100, rating: 5, created_at: '2026-01-01' }];
    vi.mocked(bookmarkService.getFolderBookmarks).mockResolvedValue(mockBookmarks);
    
    // ตั้งค่า apiClient.get ให้ฉลาดขึ้น ตอบกลับตาม URL ที่ถูกเรียก
    vi.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url.includes('/api/recipes/100')) {
        return { data: { id: 100, name: 'Spicy Chicken' } };
      }
      if (url.includes('/api/recommendations/folder/1')) {
        return { data: [{ id: 999, name: 'Magic ML Recipe', prediction_score: 0.95, image_url: '' }] };
      }
      return { data: {} };
    });

    render(<FolderDetailPage />);

    // รอให้ปุ่มโหลดขึ้นมา (ปุ่มจะแสดงก็ต่อเมื่อมี bookmark อย่างน้อย 1 อัน)
    await waitFor(() => expect(screen.getByText('Get Smart Suggestions')).toBeInTheDocument());

    // กดปุ่มขอ Suggestion
    fireEvent.click(screen.getByText('Get Smart Suggestions'));

    // รอให้โหลดเสร็จและแสดงผลลัพธ์จาก ML
    await waitFor(() => {
      expect(screen.getByText('You Might Also Like')).toBeInTheDocument();
      expect(screen.getByText('Magic ML Recipe')).toBeInTheDocument();
      expect(screen.getByText('Score: 95')).toBeInTheDocument(); // ตรวจสอบการปัดเศษ (0.95 * 100)
    });
  });

  it('handles ML suggestion API failure gracefully', async () => {
    const mockBookmarks = [{ id: 10, folder_id: 1, recipe_id: 100, rating: 5, created_at: '2026-01-01' }];
    vi.mocked(bookmarkService.getFolderBookmarks).mockResolvedValue(mockBookmarks);
    
    vi.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url.includes('/api/recipes/100')) return { data: { id: 100, name: 'Spicy Chicken' } };
      if (url.includes('/api/recommendations')) throw new Error('ML Server Down');
      return { data: {} };
    });

    render(<FolderDetailPage />);
    await waitFor(() => expect(screen.getByText('Get Smart Suggestions')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Get Smart Suggestions'));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Could not generate suggestions. Please make sure your ML server is running.');
    });
  });

  it('opens the recipe modal when a recipe card is clicked', async () => {
    const mockBookmarks = [{ id: 10, folder_id: 1, recipe_id: 100, rating: 5, created_at: '2026-01-01' }];
    vi.mocked(bookmarkService.getFolderBookmarks).mockResolvedValue(mockBookmarks);
    vi.mocked(apiClient.get).mockResolvedValue({ data: { id: 100, name: 'Spicy Chicken' } });

    render(<FolderDetailPage />);
    await waitFor(() => expect(screen.getByText('Spicy Chicken')).toBeInTheDocument());

    // คลิกที่ชื่อเพื่อเปิด Modal
    fireEvent.click(screen.getByText('Spicy Chicken'));

    // ตรวจสอบว่า RecipeModal (ที่ถูก Mock ไว้) ทำงานและแสดงชื่อ
    await waitFor(() => {
      expect(screen.getByTestId('recipe-modal')).toBeInTheDocument();
    });
  });
});