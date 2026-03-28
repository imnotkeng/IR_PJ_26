import React, { useState, useEffect } from 'react';

export default function FolderManager() {
  // 1. State for folders and modal
  const [folders, setFolders] = useState([
    // Fake data to show how it looks before you connect the database
    { id: 1, name: 'Spicy Thai', created_at: '2026-03-29T10:00:00Z' },
    { id: 2, name: 'Desserts', created_at: '2026-03-28T15:30:00Z' }
  ]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 2. Validation and Save logic
  const handleSaveFolder = async () => {
    setError(''); // Clear old errors
    const name = newFolderName.trim();

    // Validation
    if (!name) {
      setError('Folder name cannot be empty.');
      return;
    }
    if (name.length > 100) {
      setError('Folder name is too long (max 100 characters).');
      return;
    }

    setIsLoading(true);

    try {
      // 3. Call your API (Replace this with your real backend URL)
      /*
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, user_id: 1 }) // Replace 1 with real user ID
      });
      
      if (!response.ok) throw new Error('Failed to create folder');
      const newFolder = await response.json();
      */

      // Mocking the API success for now:
      const newFolder = { 
        id: Date.now(), 
        name: name, 
        created_at: new Date().toISOString() 
      };

      // 4. Refresh the list and close modal
      setFolders([...folders, newFolder]);
      setIsModalOpen(false);
      setNewFolderName(''); // Reset input

    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">My Folders</h1>

      {/* --- FOLDER GRID --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        
        {/* The "+ Create New Folder" Button Card */}
        <button 
          onClick={() => {
            setNewFolderName('');
            setError('');
            setIsModalOpen(true);
          }}
          className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200 cursor-pointer group"
        >
          <div className="bg-blue-100 p-3 rounded-full mb-3 group-hover:bg-blue-200 transition-colors">
            {/* Simple Plus Icon */}
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="font-medium text-gray-600 group-hover:text-blue-600">Create New Folder</span>
        </button>

        {/* Existing Folder Cards */}
        {folders.map((folder) => (
          <div key={folder.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              {/* Folder Icon */}
              <svg className="w-10 h-10 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
              {/* Optional: 3-dot menu for edit/delete later */}
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </div>
            <h3 className="font-semibold text-gray-800 text-lg truncate">{folder.name}</h3>
            <p className="text-xs text-gray-500 mt-auto pt-2">
              Created {new Date(folder.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
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
                  error ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                }`}
                autoFocus
              />
              {/* Error Message */}
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>

            {/* Modal Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveFolder}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Folder'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}