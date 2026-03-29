import React from 'react';
import { type Folder } from '@/service/folderService'; // Adjust path as needed

interface FolderCardProps {
  folder: Folder;
  onDelete: (id: number, e: React.MouseEvent) => void;
  onClick?: () => void; // Optional: for when you click to view recipes inside the folder
}

export default function FolderCard({ folder, onDelete, onClick }: FolderCardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col cursor-pointer relative group"
    >
      <div className="flex justify-between items-start mb-4">
        {/* Folder Icon */}
        <svg className="w-10 h-10 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
        
        {/* Delete Button (Shows on hover) */}
        <button 
          onClick={(e) => onDelete(folder.id, e)}
          className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          title="Delete Folder"
          aria-label={`Delete ${folder.name}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      
      <h3 className="font-semibold text-gray-800 text-lg truncate">{folder.name}</h3>
      <p className="text-xs text-gray-500 mt-auto pt-2">
        Created {new Date(folder.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}