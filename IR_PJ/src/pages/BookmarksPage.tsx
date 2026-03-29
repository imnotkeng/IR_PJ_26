import React, { useEffect, useState } from 'react';
import { bookmarkService, type Bookmark } from '@/service/bookmarkService';
// 1. IMPORT YOUR AUTH STORE
import { useAuthStore } from '@/store/authStore';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 2. GET THE REAL USER ID
  const { user } = useAuthStore();
  const currentUserId = user?.id;

  useEffect(() => {
    const fetchBookmarks = async () => {
      // 3. ONLY FETCH IF LOGGED IN
      if (!currentUserId) {
        setIsLoading(false);
        return; 
      }
      
      try {
        const data = await bookmarkService.getUserBookmarks(currentUserId);
        setBookmarks(data);
      } catch (error) {
        console.error("Failed to load bookmarks", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookmarks();
  }, [currentUserId]); // 👈 add currentUserId as a dependency

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading your culinary vault...</div>;

  // 4. HANDLE NOT LOGGED IN STATE
  if (!currentUserId) {
    return (
      <div className="p-6 max-w-6xl mx-auto text-center mt-20">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Please log in</h2>
        <p className="text-gray-600">You need to log in to view your saved recipes.</p>
      </div>
    );
  }

  // Group bookmarks by Folder Name for a beautiful UI representation
  // (Note: They are already sorted by rating thanks to our FastAPI backend!)
  const groupedBookmarks = bookmarks.reduce((acc, bookmark) => {
    if (!acc[bookmark.folder_name]) acc[bookmark.folder_name] = [];
    acc[bookmark.folder_name].push(bookmark);
    return acc;
  }, {} as Record<string, Bookmark[]>);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">My Saved Recipes</h1>
      <p className="text-gray-500 mb-8">All your bookmarked dishes, ranked by your ratings.</p>

      {bookmarks.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500 text-lg">Your vault is empty. Start exploring and rating dishes!</p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedBookmarks).map(([folderName, items]) => (
            <div key={folderName} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              
              {/* Folder Header */}
              <div className="flex items-center space-x-3 mb-6 border-b pb-4">
                <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
                <h2 className="text-2xl font-bold text-gray-800">{folderName}</h2>
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {items.length} items
                </span>
              </div>

              {/* Grid of Bookmarks ranked by rating */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map((bookmark) => (
                  <div key={bookmark.id} className="group flex flex-col border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                    
                    {/* Placeholder for Recipe Image (You will map this to real recipes later) */}
                    <div className="h-40 bg-gray-200 flex items-center justify-center relative">
                      <span className="text-gray-400 text-sm">Recipe #{bookmark.recipe_id} Image</span>
                      
                      {/* Rating Badge floating on top of image */}
                      <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white flex items-center px-2 py-1 rounded text-sm font-medium">
                        <span className="text-yellow-400 mr-1">★</span> {bookmark.rating}
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 truncate">
                         Recipe ID: {bookmark.recipe_id}
                      </h3>
                      <p className="text-xs text-gray-400 mt-2">
                        Saved: {new Date(bookmark.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}