'use client';

import { useState, useEffect } from 'react';
import { FileData, fileService } from '@/utils/files';
import FileIcon from './FileIcon';
import Cookies from 'js-cookie';

interface FileDetailModalProps {
  file: FileData;
  isOpen: boolean;
  onClose: () => void;
}

export default function FileDetailModal({ file, isOpen, onClose }: FileDetailModalProps) {
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setImageError(false);
      setImageUrl(null);
      
      const isImageFile = file.mime_type?.startsWith('image/') || 
        ['png', 'jpg', 'jpeg', 'gif'].includes(file.filename.split('.').pop()?.toLowerCase() || '');
      
      if (isImageFile) {
        const fetchImage = async () => {
          try {
            const token = Cookies.get('access_token');
            const response = await fetch(`http://localhost:8000/api/v1/files/${file.id}/download`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok) {
              const blob = await response.blob();
              const url = URL.createObjectURL(blob);
              setImageUrl(url);
            } else {
              setImageError(true);
            }
          } catch (error) {
            setImageError(true);
          }
        };
        
        fetchImage();
      }
    }

    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [isOpen, file.id]);

  if (!isOpen) return null;

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
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isImage = file.mime_type?.startsWith('image/') || 
    ['png', 'jpg', 'jpeg', 'gif'].includes(file.filename.split('.').pop()?.toLowerCase() || '');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-3">
              <FileIcon 
                filename={file.filename} 
                mimeType={file.mime_type}
                fileId={file.id}
                size="lg"
              />
              <div>
                <h2 className="text-xl font-mono text-gray-900">
                  {file.title || file.original_filename}
                </h2>
                {file.title && (
                  <p className="text-sm text-gray-500 font-mono mt-1">
                    {file.original_filename}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Image Preview */}
          {isImage && imageUrl && !imageError && (
            <div className="mb-6 text-center">
              <img
                src={imageUrl}
                alt={file.filename}
                className="max-w-full max-h-96 mx-auto border border-gray-200"
                onError={() => setImageError(true)}
              />
            </div>
          )}

          {/* File Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">File Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Size:</span>
                  <span className="font-mono">{formatFileSize(file.size_bytes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Type:</span>
                  <span className="font-mono">{file.mime_type || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className={`font-mono ${
                    file.upload_status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {file.upload_status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Downloads:</span>
                  <span className="font-mono">{file.download_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Uploaded:</span>
                  <span className="font-mono">{formatDate(file.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">SHA256:</span>
                  <span className="font-mono text-xs break-all">{file.sha256}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Tags</h3>
              {file.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {file.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No tags</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 pt-6 border-t border-gray-200 flex space-x-3">
            <button
              onClick={async () => {
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
              }}
              className="px-4 py-2 bg-gray-900 text-white text-sm hover:bg-gray-800"
            >
              Download
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}