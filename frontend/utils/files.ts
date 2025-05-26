import api from './api';

export interface FileData {
  id: number;
  filename: string;
  original_filename: string;
  size_bytes: number;
  mime_type?: string;
  sha256: string;
  upload_status: string;
  blocked: boolean;
  download_count: number;
  tags: string[];
  created_at: string;
  download_url?: string;
}

export interface FileListResponse {
  files: FileData[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface SearchQuery {
  query?: string;
  tags?: string;
  mime_type?: string;
  page?: number;
  per_page?: number;
}

export const fileService = {
  async uploadFile(file: File, tags: string[] = []): Promise<FileData> {
    const formData = new FormData();
    formData.append('file', file);
    if (tags.length > 0) {
      formData.append('tags', tags.join(','));
    }

    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  async getUserFiles(page: number = 1, perPage: number = 20): Promise<FileListResponse> {
    const response = await api.get(`/files/?page=${page}&per_page=${perPage}`);
    return response.data;
  },

  async searchFiles(query: SearchQuery): Promise<FileListResponse> {
    const params = new URLSearchParams();
    
    if (query.query) params.append('query', query.query);
    if (query.tags) params.append('tags', query.tags);
    if (query.mime_type) params.append('mime_type', query.mime_type);
    if (query.page) params.append('page', query.page.toString());
    if (query.per_page) params.append('per_page', query.per_page.toString());

    const response = await api.get(`/files/search?${params.toString()}`);
    return response.data;
  },

  async getFile(fileId: number): Promise<FileData> {
    const response = await api.get(`/files/${fileId}`);
    return response.data;
  },

  async deleteFile(fileId: number): Promise<void> {
    await api.delete(`/files/${fileId}`);
  },

  getDownloadUrl(fileId: number): string {
    return `${api.defaults.baseURL}/files/${fileId}/download`;
  }
};