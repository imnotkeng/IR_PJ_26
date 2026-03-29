import React, { useState, useEffect } from 'react';
import { useFolderStore } from '@/store/folderStore'; // Adjust path as needed
import FolderCard from '@/components/FolderCard';     // Adjust path as needed
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
export default function FolderPage() {
  // 1. Pull state and actions from Zustand
  const { folders, isLoading: isStoreLoading, error: storeError, fetchFolders, addFolder, deleteFolder } = useFolderStore();
  const { user } = useAuthStore();
  const currentUserId = user?.id;
  // 2. Local state for modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');
  const [localError, setLocalError] = useState<string>('');
  const navigate = useNavigate();


  // Fetch folders when component mounts
useEffect(() => {
    if (currentUserId) {
      fetchFolders(currentUserId);
    }
  }, [fetchFolders, currentUserId]);

  // Handle saving the new folder
  const handleSaveFolder = async () => {
    setLocalError('');
    const name = newFolderName.trim();

    if (!name) {
      setLocalError('Folder name cannot be empty.');
      return;
    }
    if (name.length > 100) {
      setLocalError('Folder name is too long (max 100 characters).');
      return;
    }
    if (!currentUserId) {               
    setLocalError('You must be logged in to create a folder.');
    return;
  }
    // Call Zustand action to add folder
    await addFolder(name, currentUserId);
    
    // Close modal and reset input if successful
    setIsModalOpen(false);
    setNewFolderName('');
  };

  const handleDelete = async (folderId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents triggering the card's onClick event
    if (window.confirm("Are you sure you want to delete this folder?")) {
      await deleteFolder(folderId);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">My Folders</h1>

      {/* Show store errors if fetching/deleting failed */}
      {storeError && <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg">{storeError}</div>}

      {/* --- FOLDER GRID --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        
        {/* "+ Create New Folder" Button Card */}
        <button 
          onClick={() => {
            setNewFolderName('');
            setLocalError('');
            setIsModalOpen(true);
          }}
          className="flex flex-col items-center justify-center h-full min-h-[160px] border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200 cursor-pointer group"
        >
          <div className="bg-blue-100 p-3 rounded-full mb-3 group-hover:bg-blue-200 transition-colors">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="font-medium text-gray-600 group-hover:text-blue-600">Create New Folder</span>
        </button>

        {/* Existing Folders */}
        {isStoreLoading && folders.length === 0 ? (
          <div className="col-span-full text-gray-500 mt-4 flex justify-center items-center h-32">
            Loading folders...
          </div>
        ) : (
          folders.map((folder) => (
            <FolderCard 
              key={folder.id} 
              folder={folder} 
              onDelete={handleDelete} 
              // onClick={() => navigate(`/folders/${folder.id}`)} // Ready for React Router!
              onClick={() => navigate(`/folders/${folder.id}`)} 
            />
          ))
        )}
      </div>

      {/* --- MODAL OVERLAY --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            
            <h2 className="text-xl font-bold mb-4 text-gray-800">Create New Folder</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Folder Name
              </label>
              <input 
                type="text" 
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g. Healthy Dinner"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
                  localError ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                }`}
                autoFocus
              />
              {localError && <p className="text-red-500 text-sm mt-1">{localError}</p>}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isStoreLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveFolder}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                disabled={isStoreLoading}
              >
                {isStoreLoading ? 'Saving...' : 'Save Folder'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}