import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { deleteFile } from '../../services/firebase';
import { toast } from 'react-toastify';
import { File, Download, Trash2, Copy, Check, Clock, Calendar, User, RefreshCw } from 'lucide-react';

const FileList = ({ files, refreshTrigger, onRefresh }) => {
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // ✅ Debug: Log files when they change
  useEffect(() => {
    console.log('📄 FileList received files:', files);
    console.log('📄 Number of files:', files.length);
    
    // Log each file's details
    files.forEach((file, index) => {
      console.log(`📄 File ${index + 1}:`, {
        id: file.id,
        name: file.name,
        userId: file.userId,
        uploadedAt: file.uploadedAt
      });
    });
  }, [files]);

  const handleDelete = async (fileId, filePath) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    
    try {
      setDeleting(fileId);
      await deleteFile(fileId, filePath);
      toast.success('File deleted successfully');
    } catch (error) {
      toast.error('Failed to delete file');
      console.error(error);
    } finally {
      setDeleting(null);
    }
  };

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedId(Date.now());
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="p-4 bg-white/5 rounded-full inline-block">
          <File className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold mt-4">No files uploaded yet</h3>
        <p className="text-gray-400 mt-2">Drop your files above to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Your Files</h3>
          {user && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
              <User className="h-3 w-3" />
              {user.displayName || user.email?.split('@')[0] || 'User'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
            title="Refresh files"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-400">{files.length} files</span>
        </div>
      </div>

      {files.map((file) => (
        <div 
          key={file.id}
          className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="p-2 bg-primary/10 rounded-lg">
                <File className="h-6 w-6 text-primary" />
              </div>
              
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{file.name}</p>
                <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                  <span>{formatSize(file.size)}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(file.uploadedAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {file.type || 'Unknown type'}
                  </span>
                  {/* ✅ Show file owner */}
                  {user && (
                    <span className="flex items-center gap-1 text-primary/60">
                      <User className="h-3 w-3" />
                      {user.email?.split('@')[0] || 'me'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyLink(file.url)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                title="Copy link"
              >
                {copiedId === Date.now() ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
              
              <a
                href={file.url}
                download={file.name}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </a>
              
              <button
                onClick={() => handleDelete(file.id, file.path)}
                disabled={deleting === file.id}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition disabled:opacity-50"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FileList;