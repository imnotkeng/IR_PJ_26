import React, { useState, useEffect } from 'react';
import { useFolderStore } from '@/store/folderStore';
import { bookmarkService } from '@/service/bookmarkService';
// 1. IMPORT YOUR AUTH STORE
import { useAuthStore } from '@/store/authStore'; 

interface BookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: number; 
  recipeName: string;
}

export default function BookmarkModal({ isOpen, onClose, recipeId, recipeName }: BookmarkModalProps) {
  const { folders, fetchFolders } = useFolderStore();
  
  // 2. GET THE REAL USER ID
  const { user } = useAuthStore();
  const currentUserId = user?.id; // If no one is logged in, this will be undefined

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
    
    // 3. PREVENT SAVING IF NO USER IS LOGGED IN
    if (!currentUserId) {
      setError("Please log in to save recipes.");
      return;
    }

    setIsLoading(true);

    try {
      let finalFolderId = parseInt(selectedFolderId);

      // Create new folder on the fly
      if (isCreatingNew) {
        if (!newFolderName.trim()) throw new Error("Folder name cannot be empty.");
        
        const { folderService } = await import('@/service/folderService');
        // This will now pass the REAL currentUserId instead of hardcoded `1`
        const newFolder = await folderService.createFolder(newFolderName.trim(), currentUserId);
        finalFolderId = newFolder.id;
        
        fetchFolders(currentUserId); 
      }

      if (!finalFolderId || isNaN(finalFolderId)) {
        throw new Error("Please select or create a folder.");
      }

      // Save the Bookmark
      await bookmarkService.createBookmark({
        user_id: currentUserId,
        folder_id: finalFolderId,
        recipe_id: recipeId,
        rating: rating,
      });

      onClose(); // Success!
    } catch (err: any) {
      // Show backend error message cleanly
      setError(err.response?.data?.detail || err.message || "Failed to save bookmark.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Save Recipe</h2>
        <p className="text-gray-500 text-sm mb-6 truncate">{recipeName}</p>

        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

        {/* --- 1. Star Rating --- */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button 
                key={star} 
                onClick={() => setRating(star)}
                disabled={!currentUserId} // Disable if not logged in
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                  rating >= star ? 'text-yellow-400 bg-yellow-50' : 'text-gray-300 hover:bg-gray-100'
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
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Select Folder</label>
            <button 
              onClick={() => setIsCreatingNew(!isCreatingNew)}
              disabled={!currentUserId}
              className="text-sm text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
              autoFocus
            />
          ) : (
            <select 
              value={selectedFolderId} 
              onChange={(e) => setSelectedFolderId(e.target.value)}
              disabled={!currentUserId}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
            >
              <option value="" disabled>-- Choose a folder --</option>
              {folders.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* --- 3. Action Buttons --- */}
        <div className="flex justify-end space-x-3 mt-8">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={isLoading || !currentUserId}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Bookmark'}
          </button>
        </div>
      </div>
    </div>
  );
}