'use client';

import { useState } from 'react';
import { FileData } from '@/utils/files';
import { fileService } from '@/utils/files';
import FileIcon from './FileIcon';
import FileDetailModal from './FileDetailModal';

interface FileListProps {
  files: FileData[];
  onFileDeleted?: () => void;
}

export default function FileList({ files, onFileDeleted }: FileListProps) {
  const [deletingFiles, setDeletingFiles] = useState<Set<number>>(new Set());
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit'
    });
  };

  const handleDownload = async (file: FileData) => {
    try {
      const response = await fileService.downloadFile(file.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = file.original_filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to download file');
    }
  };

  const handleDelete = async (fileId: number) => {
    if (!confirm('Delete this file?')) {
      return;
    }

    setDeletingFiles(prev => new Set(prev).add(fileId));

    try {
      await fileService.deleteFile(fileId);
      onFileDeleted?.();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete file');
    } finally {
      setDeletingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-gray-500">No files uploaded yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1">
        {files.map((file) => (
          <div
            key={file.id}
            className="border-b border-gray-100 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div 
                className="flex-1 min-w-0 flex items-center space-x-3 cursor-pointer"
                onClick={() => setSelectedFile(file)}
              >
                <FileIcon 
                  filename={file.filename}
                  mimeType={file.mime_type}
                  fileId={file.id}
                  size="md"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-sm font-mono text-gray-900 truncate">
                      {file.title || file.original_filename}
                    </h3>
                    {file.title && (
                      <span className="text-xs text-gray-400 font-mono">
                        ({file.original_filename})
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatFileSize(file.size_bytes)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(file.created_at)}
                    </span>
                    {file.download_count > 0 && (
                      <span className="text-xs text-gray-400">
                        {file.download_count} downloads
                      </span>
                    )}
                  </div>

                  {file.tags.length > 0 && (
                    <div className="mt-1 flex items-center flex-wrap gap-1">
                      {file.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(file);
                  }}
                  className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1 border border-gray-300 hover:bg-gray-50"
                >
                  Download
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(file.id);
                  }}
                  disabled={deletingFiles.has(file.id)}
                  className="text-xs text-gray-500 hover:text-red-600 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedFile && (
        <FileDetailModal
          file={selectedFile}
          isOpen={!!selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </>
  );
}