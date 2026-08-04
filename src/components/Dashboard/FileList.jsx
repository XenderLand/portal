import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { deleteFile } from '../../services/firebase';
import { toast } from 'react-toastify';
import {
  File,
  Download,
  Trash2,
  Copy,
  Check,
  Clock,
  Calendar,
  User,
  RefreshCw,
} from 'lucide-react';

// A generic "document with folded corner" page shape, colored and labeled
// per file type — the same visual convention Explorer/Finder/Drive use for
// file-type thumbnails. Renders as a self-contained inline SVG, so no
// external icon assets or brand logos are needed.
const DocumentPage = ({ label, bg, fold, text }) => (
  <svg viewBox="0 0 40 40" className="h-10 w-10 shrink-0" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 2h16l8 8v26a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
      fill={bg}
    />
    <path d="M24 2v8h8z" fill={fold} />
    {label && (
      <text
        x="20"
        y="27"
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        fontFamily="Arial, sans-serif"
        fill={text || '#fff'}
      >
        {label}
      </text>
    )}
  </svg>
);

// Maps a MIME type / filename to a document thumbnail spec (colors + label).
// Falls back to a plain gray page for anything unrecognized.
const getFileTypeDisplay = (type = '', name = '') => {
  const ext = name.split('.').pop()?.toLowerCase() || '';

  if (type.startsWith('video/')) {
    return { label: '▶', bg: '#ec4899', fold: '#f472b6' };
  }
  if (type.startsWith('audio/')) {
    return { label: '♪', bg: '#3b82f6', fold: '#60a5fa' };
  }
  if (type === 'application/pdf' || ext === 'pdf') {
    return { label: 'PDF', bg: '#dc2626', fold: '#f87171' };
  }
  if (['xls', 'xlsx', 'csv'].includes(ext) || type.includes('spreadsheet') || type === 'text/csv') {
    return { label: 'XLS', bg: '#16a34a', fold: '#4ade80' };
  }
  if (['ppt', 'pptx'].includes(ext) || type.includes('presentation')) {
    return { label: 'PPT', bg: '#d97706', fold: '#fbbf24' };
  }
  if (['doc', 'docx'].includes(ext) || type.includes('wordprocessingml') || type === 'application/msword') {
    return { label: 'DOC', bg: '#2563eb', fold: '#60a5fa' };
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return { label: 'ZIP', bg: '#ca8a04', fold: '#fbbf24' };
  }
  if (['js', 'jsx', 'ts', 'tsx', 'json', 'html', 'css', 'py', 'java'].includes(ext)) {
    return { label: '</>', bg: '#0891b2', fold: '#22d3ee' };
  }
  if (['txt', 'rtf'].includes(ext) || type === 'text/plain') {
    return { label: 'TXT', bg: '#64748b', fold: '#94a3b8' };
  }
  return { label: ext ? ext.slice(0, 4).toUpperCase() : 'FILE', bg: '#4b5563', fold: '#9ca3af' };
};

// Shows an actual image preview (from the file's stored download URL) for
// image files, otherwise a colored document-page thumbnail for the type.
const FileThumbnail = ({ name, type, url }) => {
  if (type?.startsWith('image/') && url) {
    return (
      <img
        src={url}
        alt={name}
        className="h-10 w-10 rounded-lg object-cover border border-white/10 shrink-0"
      />
    );
  }

  const spec = getFileTypeDisplay(type, name);
  return <DocumentPage {...spec} />;
};

const FileList = ({ files, refreshTrigger, onRefresh }) => {
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(null);
  const [copiedFileId, setCopiedFileId] = useState(null);

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

  const handleCopyLink = (fileId, url) => {
    navigator.clipboard.writeText(url);
    setCopiedFileId(fileId);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopiedFileId(null), 2000);
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
              <FileThumbnail name={file.name} type={file.type} url={file.url} />

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
                onClick={() => handleCopyLink(file.id, file.url)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                title="Copy link"
              >
                {copiedFileId === file.id ? (
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
