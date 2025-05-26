'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from '@/components/FileUpload';
import FileList from '@/components/FileList';
import SearchBar from '@/components/SearchBar';
import { fileService, FileData, SearchQuery } from '@/utils/files';
import { authService } from '@/utils/auth';

export default function DashboardPage() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentSearch, setCurrentSearch] = useState<SearchQuery | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    loadFiles();
  }, [router]);

  const loadFiles = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const response = await fileService.getUserFiles(page, 20);
      setFiles(response.files);
      setCurrentPage(response.page);
      setTotalPages(response.total_pages);
      setCurrentSearch(null);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: SearchQuery) => {
    setIsSearching(true);
    try {
      const response = await fileService.searchFiles(query);
      setFiles(response.files);
      setCurrentPage(response.page);
      setTotalPages(response.total_pages);
      setCurrentSearch(query);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUploadComplete = () => {
    if (currentSearch) {
      handleSearch(currentSearch);
    } else {
      loadFiles(currentPage);
    }
  };

  const handleFileDeleted = () => {
    if (currentSearch) {
      handleSearch(currentSearch);
    } else {
      loadFiles(currentPage);
    }
  };

  const handlePageChange = async (page: number) => {
    if (currentSearch) {
      const newQuery = { ...currentSearch, page };
      await handleSearch(newQuery);
    } else {
      await loadFiles(page);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-12">
        <h1 className="text-2xl font-light text-gray-900 mb-2">Upload</h1>
        <p className="text-sm text-gray-600">Share AI models with the community</p>
      </div>

      <div className="space-y-12">
        <div className="border border-gray-200 p-8">
          <FileUpload onUploadComplete={handleUploadComplete} />
        </div>

        <div>
          <h2 className="text-lg font-light text-gray-900 mb-6">Your uploads</h2>
          
          <SearchBar onSearch={handleSearch} isLoading={isSearching} />

          {isLoading ? (
            <div className="text-center py-16">
              <p className="text-sm text-gray-500">Loading...</p>
            </div>
          ) : (
            <>
              <FileList files={files} onFileDeleted={handleFileDeleted} />
              
              {totalPages > 1 && (
                <div className="mt-8 text-center">
                  <div className="inline-flex items-center space-x-4 text-sm">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <span className="text-gray-500">
                      {currentPage} / {totalPages}
                    </span>
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}