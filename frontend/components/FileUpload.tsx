'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { fileService } from '@/utils/files';

interface FileUploadProps {
  onUploadComplete?: () => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [tags, setTags] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    setError(null);

    const tagList = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

    for (const file of acceptedFiles) {
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        await fileService.uploadFile(file, tagList);
        
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
      } catch (err: any) {
        setError(err.response?.data?.detail || `Failed to upload ${file.name}`);
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      }
    }

    setUploading(false);
    setTags('');
    
    setTimeout(() => {
      setUploadProgress({});
      onUploadComplete?.();
    }, 2000);
  }, [tags, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: uploading,
    maxSize: 10 * 1024 * 1024 * 1024, // 10GB
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <label htmlFor="tags" className="block text-sm text-gray-700 mb-2">
          Tags (comma-separated)
        </label>
        <input
          type="text"
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="lora, checkpoint, anime, realistic"
          className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-gray-500"
          disabled={uploading}
        />
        <p className="text-xs text-gray-500 mt-1">
          Help others find your models with relevant tags
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed border-gray-300 p-12 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-gray-500 bg-gray-50'
            : uploading
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'hover:border-gray-500 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div>
            <p className="text-sm text-gray-700 mb-4">Uploading...</p>
            <div className="space-y-3">
              {Object.entries(uploadProgress).map(([filename, progress]) => (
                <div key={filename} className="text-left">
                  <div className="flex justify-between mb-1 text-xs">
                    <span className="text-gray-600 truncate font-mono">{filename}</span>
                    <span className="text-gray-500">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-1">
                    <div
                      className="bg-gray-600 h-1 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : isDragActive ? (
          <div>
            <p className="text-sm text-gray-700">Drop files here</p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-700 mb-2">
              Drop files or click to upload
            </p>
            <p className="text-xs text-gray-500">
              .safetensors, .ckpt, .pth, .bin, .pt files up to 10GB
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 border border-red-300 bg-red-50">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}