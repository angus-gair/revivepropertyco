/**
 * Customer Portal Document Management Page
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Filter,
  X,
  FileImage,
  File,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { listDocuments, uploadDocument, deleteDocument } from '../../services/customerService';
import type { CustomerDocument } from '../../services/customerService';

const CustomerDocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<CustomerDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [filter, setFilter] = useState<'all' | 'image' | 'pdf' | 'other'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    filterAndSortDocuments();
  }, [documents, filter, sortBy, sortOrder]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await listDocuments();
      setDocuments(response.documents);
    } catch (error: any) {
      setError(error.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortDocuments = () => {
    let filtered = [...documents];

    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter(doc => {
        if (!doc.fileName) return false;
        const ext = doc.fileName.split('.').pop()?.toLowerCase();
        if (filter === 'image') return ext ? ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) : false;
        if (filter === 'pdf') return ext === 'pdf';
        return true;
      });
    }

    // Apply sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
      } else if (sortBy === 'name') {
        comparison = (a.fileName || '').localeCompare(b.fileName || '');
      } else if (sortBy === 'size') {
        comparison = a.fileSize - b.fileSize;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredDocuments(filtered);
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const uploadId = `${Date.now()}-${i}`;

      try {
        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
          setError(`File type not allowed: ${file.name}`);
          continue;
        }

        // Validate file size (10 MB)
        if (file.size > 10 * 1024 * 1024) {
          setError(`File too large (max 10 MB): ${file.name}`);
          continue;
        }

        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          setUploadProgress(prev => ({ ...prev, [uploadId]: progress }));
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Upload file
        await uploadDocument(file);
        setSuccess(`Successfully uploaded ${file.name}`);
      } catch (error: any) {
        setError(error.message || `Failed to upload ${file.name}`);
      } finally {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[uploadId];
          return newProgress;
        });
      }
    }

    // Reload documents
    await loadDocuments();
    setUploading(false);
  };

  const handleDelete = async (documentId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    try {
      await deleteDocument(documentId);
      setSuccess('Document deleted successfully');
      await loadDocuments();
    } catch (error: any) {
      setError(error.message || 'Failed to delete document');
    }
  };

  const handleDownload = (doc: CustomerDocument) => {
    // Create download link
    const link = document.createElement('a');
    link.href = `/api/customer/documents/${doc.documentId}`;
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getFileIcon = (fileName: string) => {
    if (!fileName) return File;
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return FileImage;
    }
    if (ext === 'pdf') {
      return FileText;
    }
    return File;
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-4 md:px-12 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight uppercase mb-4">
            Documents
          </h1>
          <p className="text-neutral-500">
            Upload and manage your project documents
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-grow">
              <div className="font-semibold text-red-900 mb-1">Upload Error</div>
              <div className="text-sm text-red-700">{error}</div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 flex items-start gap-3">
            <CheckCircle2 className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-grow">
              <div className="font-semibold text-green-900 mb-1">Success</div>
              <div className="text-sm text-green-700">{success}</div>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="text-green-400 hover:text-green-600"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Upload Section */}
        <div className="mb-8 p-8 bg-white border border-outline-variant shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-display font-bold tracking-tight uppercase mb-2">
                Upload Documents
              </h2>
              <p className="text-sm text-neutral-500">
                PDF, images (JPG, PNG), or documents (DOC, DOCX) • Max 10 MB each
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />

          <div className="border-2 border-dashed border-neutral-300 rounded-lg p-12 text-center hover:border-black transition-colors">
            <Upload className="text-neutral-400 mx-auto mb-4" size={48} />
            <div className="font-display text-sm font-bold tracking-wider uppercase mb-2">
              Drop files here or click to upload
            </div>
            <p className="text-sm text-neutral-500 mb-4">
              Drag and drop or click to browse
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="bg-black text-white px-6 py-3 font-display text-xs font-bold tracking-widest hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Select Files'}
            </button>
          </div>

          {/* Upload Progress */}
          {Object.keys(uploadProgress).length > 0 && (
            <div className="mt-6 space-y-3">
              {Object.entries(uploadProgress).map(([id, progress]) => (
                <div key={id} className="bg-surface-low p-4 rounded">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-display text-xs font-bold tracking-wider">
                      UPLOADING_{progress}%
                    </div>
                    <div className="text-xs text-neutral-500">
                      {progress < 100 ? 'In progress' : 'Complete'}
                    </div>
                  </div>
                  <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-neutral-400" />
            <div className="flex bg-white border border-outline-variant p-1">
              {(['all', 'image', 'pdf', 'other'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 font-display text-[0.6rem] font-bold tracking-widest transition-all ${
                    filter === f
                      ? 'bg-black text-white'
                      : 'text-neutral-400 hover:text-black hover:bg-neutral-50'
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="flex bg-white border border-outline-variant p-1">
            {(['date', 'name', 'size'] as const).map((sort) => (
              <button
                key={sort}
                onClick={() => {
                  if (sortBy === sort) {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy(sort);
                    setSortOrder('desc');
                  }
                }}
                className={`px-3 py-1.5 font-display text-[0.6rem] font-bold tracking-widest transition-all flex items-center gap-1 ${
                  sortBy === sort
                    ? 'bg-black text-white'
                    : 'text-neutral-400 hover:text-black hover:bg-neutral-50'
                }`}
              >
                {sort.toUpperCase()}
                {sortBy === sort && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            ))}
          </div>
        </div>

        {/* Documents List */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="bg-white border border-outline-variant p-16 text-center">
            <FileText className="text-neutral-300 mx-auto mb-4" size={64} />
            <div className="font-display text-xl font-bold tracking-tight uppercase mb-2">
              No Documents Yet
            </div>
            <p className="text-neutral-500 mb-6">
              Upload your first document to get started
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-black text-white px-6 py-3 font-display text-xs font-bold tracking-widest hover:bg-neutral-800 transition-colors inline-flex items-center gap-2"
            >
              <Upload size={16} />
              Upload Documents
            </button>
          </div>
        ) : (
          <div className="bg-white border border-outline-variant divide-y divide-outline-variant">
            {filteredDocuments.map((doc) => {
              const Icon = getFileIcon(doc.fileName);
              return (
                <div
                  key={doc.documentId}
                  className="p-6 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-surface-low rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="text-neutral-400" size={24} />
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className="font-display text-sm font-bold tracking-tight text-neutral-900 truncate mb-1">
                        {doc.fileName}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-neutral-500">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>{formatDate(doc.uploadedAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-2 hover:bg-surface-low rounded transition-colors"
                        title="Download"
                      >
                        <Download size={18} className="text-neutral-400 hover:text-black" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.documentId, doc.fileName)}
                        className="p-2 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} className="text-neutral-400 hover:text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDocumentsPage;
