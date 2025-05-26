'use client';

import { useState } from 'react';
import { SearchQuery } from '@/utils/files';

interface SearchBarProps {
  onSearch: (query: SearchQuery) => void;
  isLoading?: boolean;
}

export default function SearchBar({ onSearch, isLoading = false }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [tags, setTags] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    const searchQuery: SearchQuery = {
      query: query.trim() || undefined,
      tags: tags.trim() || undefined,
      page: 1,
      per_page: 20
    };

    onSearch(searchQuery);
  };

  const handleClear = () => {
    setQuery('');
    setTags('');
    setShowFilters(false);
    onSearch({ page: 1, per_page: 20 });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-500"
            disabled={isLoading}
          />
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm"
          >
            Filters
          </button>
          
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 text-sm"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {showFilters && (
          <div className="border border-gray-200 p-4 bg-gray-50">
            <div className="space-y-3">
              <div>
                <label htmlFor="tags" className="block text-xs text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  id="tags"
                  placeholder="lora, checkpoint, anime"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-500"
                  disabled={isLoading}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleClear}
                  className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                  disabled={isLoading}
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                  disabled={isLoading}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}