'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

interface FileIconProps {
  filename: string;
  mimeType?: string;
  fileId: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function FileIcon({ filename, mimeType, fileId, size = 'md' }: FileIconProps) {
  const [imageError, setImageError] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  const getFileExtension = () => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const getFileTypeIcon = () => {
    const ext = getFileExtension();
    
    if (mimeType?.startsWith('image/')) {
      return '🖼️';
    }
    
    switch (ext) {
      case 'pdf':
        return '📄';
      case 'txt':
        return '📝';
      case 'zip':
      case 'tar':
      case 'gz':
        return '📦';
      case 'mp4':
      case 'mp3':
        return '🎵';
      case 'doc':
      case 'docx':
        return '📋';
      case 'safetensors':
      case 'ckpt':
      case 'pth':
      case 'bin':
      case 'pt':
        return '🧠';
      case 'gif':
        return '🎞️';
      case 'png':
      case 'jpg':
      case 'jpeg':
        return '🖼️';
      default:
        return '📄';
    }
  };

  useEffect(() => {
    const fetchThumbnail = async () => {
      const isImageFile = mimeType?.startsWith('image/') || 
        ['png', 'jpg', 'jpeg', 'gif'].includes(getFileExtension());
      
      if (isImageFile && !thumbnailUrl && !imageError) {
        try {
          const token = Cookies.get('access_token');
          const response = await fetch(`http://localhost:8000/api/v1/files/${fileId}/thumbnail`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setThumbnailUrl(url);
          } else {
            setImageError(true);
          }
        } catch (error) {
          setImageError(true);
        }
      }
    };

    fetchThumbnail();

    // Cleanup function to revoke object URL
    return () => {
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [fileId, mimeType]);

  const isImage = mimeType?.startsWith('image/') || 
    ['png', 'jpg', 'jpeg', 'gif'].includes(getFileExtension());

  if (isImage && thumbnailUrl && !imageError) {
    return (
      <div className={`${sizeClasses[size]} flex-shrink-0 bg-gray-100 rounded overflow-hidden`}>
        <img
          src={thumbnailUrl}
          alt={filename}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} flex-shrink-0 bg-gray-100 rounded flex items-center justify-center text-gray-600`}>
      <span className="text-sm">{getFileTypeIcon()}</span>
    </div>
  );
}