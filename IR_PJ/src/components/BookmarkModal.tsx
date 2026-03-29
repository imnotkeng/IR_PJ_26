import React, { useState, useEffect } from 'react';
import { useFolderStore } from '@/store/folderStore';
import { bookmarkService } from '@/service/bookmarkService';
import { useAuthStore } from '@/store/authStore'; 

interface BookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: number; 
  recipeName: string;
}

export default function BookmarkModal({ isOpen, onClose, recipeId, recipeName }: BookmarkModalProps) {
  const { folders, fetchFolders } = useFolderStore();
  
  const { user } = useAuthStore();
  const currentUserId = user?.id; 

  const [rating, setRating] = useState<number>(5);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (currentUserId) {
        fetchFolders(currentUserId);
      } else {
        setError("You must be logged in to save recipes.");
      }
      setRating(5);
      setError('');
    }
  }, [isOpen, fetchFolders, currentUserId]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setError('');
    
    if (!currentUserId) {
      setError("Please log in to save recipes.");
      return;
    }

    setIsLoading(true);

    try {
      let finalFolderId = parseInt(selectedFolderId);

      if (isCreatingNew) {
        if (!newFolderName.trim()) throw new Error("Folder name cannot be empty.");
        
        const { folderService } = await import('@/service/folderService');
        const newFolder = await folderService.createFolder(newFolderName.trim(), currentUserId);
        finalFolderId = newFolder.id;
        
        fetchFolders(currentUserId); 
      }

      if (!finalFolderId || isNaN(finalFolderId)) {
        throw new Error("Please select or create a folder.");
      }

      await bookmarkService.createBookmark({
        user_id: currentUserId,
        folder_id: finalFolderId,
        recipe_id: recipeId,
        rating: rating,
      });

      onClose(); 
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(error.response?.data?.detail || error.message || "Failed to save bookmark.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // 1. CHANGED OUTER DIV: Added backdrop-blur-sm, slate-900/60, and transition
    <div className="fixed inset-0 bg-slate-900/60 flex justify-center items-center p-4 z-50 backdrop-blur-sm transition-all duration-300">
      
    
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md p-8 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Optional: Add a subtle close button in the top right like RecipeModal */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 bg-slate-100 rounded-full w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-all"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-slate-800 mb-2 mt-2">Save Recipe</h2>
        <p className="text-slate-500 text-sm mb-6 truncate">{recipeName}</p>

        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</div>}

        {/* --- 1. Star Rating --- */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-3">Your Rating</label>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button 
                key={star} 
                onClick={() => setRating(star)}
                disabled={!currentUserId}
                className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${
                  rating >= star ? 'text-amber-400 bg-amber-50 scale-110' : 'text-slate-300 hover:bg-slate-100'
                }`}
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* --- 2. Folder Selection / Creation --- */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-bold text-slate-700">Select Folder</label>
            <button 
              onClick={() => setIsCreatingNew(!isCreatingNew)}
              disabled={!currentUserId}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline disabled:text-slate-400 disabled:no-underline"
            >
              {isCreatingNew ? 'Select Existing' : '+ New Folder'}
            </button>
          </div>

          {isCreatingNew ? (
            <input 
              type="text" 
              placeholder="Enter new folder name..." 
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              disabled={!currentUserId}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 transition-all"
              autoFocus
            />
          ) : (
            <select 
              value={selectedFolderId} 
              onChange={(e) => setSelectedFolderId(e.target.value)}
              disabled={!currentUserId}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 transition-all bg-white"
            >
              <option value="" disabled>-- Choose a folder --</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* --- 3. Action Buttons --- */}
        <div className="flex justify-end space-x-3 mt-4">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-medium bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={isLoading || !currentUserId}
            className="px-5 py-2.5 text-white font-medium bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isLoading ? 'Saving...' : 'Save Bookmark'}
          </button>
        </div>
      </div>
    </div>
  );
}