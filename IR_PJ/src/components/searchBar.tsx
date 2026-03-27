import React, { useState } from 'react';
import { useSearch } from '../hooks/useSearch';

export const SearchBar = () => {
  const [localQuery, setLocalQuery] = useState('');
  const { handleSearch } = useSearch();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(localQuery);
  };

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <input
        type="text"
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        placeholder="Search dishes, ingredients, or process..."
        className="border p-2 rounded w-full"
      />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Search
      </button>
    </form>
  );
};