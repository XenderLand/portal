import React, { useState } from 'react';
import { 
  File, 
  Download, 
  Trash2, 

  Copy, 
  Check,

  Calendar,
  User,

  FileText,
  Image,
  FileArchive,
  FileCode,
  FileSpreadsheet
} from 'lucide-react';
import { adminDeleteFile, getFileUrl } from '../../services/adminFirebase';
import { toast } from 'react-toastify';

const FileTable = ({ 
  files, 
  selectedFiles, 
  onSelectFile, 
  onSelectAll,
  onFileDelete,
  onFileUpdate,
  loadMore,
  hasMore
}) => {
  const [loading, setLoading] = useState({});
  const [copyId, setCopyId] = useState(null);

  const getFileIcon = (type) => {
    if (!type) return File;
    if (type.includes('pdf')) return FileText;
    if (type.includes('image')) return Image;
    if (type.includes('zip') || type.includes('rar')) return FileArchive;
    if (type.includes('javascript') || type.includes('html') || type.includes('css')) return FileCode;
    if (type.includes('excel') || type.includes('csv')) return FileSpreadsheet;
    return File;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDelete = async (fileId, filePath) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    
    try {
      setLoading(prev => ({ ...prev, [fileId]: true }));
      await adminDeleteFile(fileId, filePath);
      toast.success('File deleted successfully');
      onFileDelete(fileId);
    } catch (error) {
      toast.error('Failed to delete file');
      console.error(error);
    } finally {
      setLoading(prev => ({ ...prev, [fileId]: false }));
    }
  };

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url);
    setCopyId(Date.now());
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopyId(null), 2000);
  };

  const handleDownload = async (filePath, fileName) => {
    try {
      setLoading(prev => ({ ...prev, ['download']: true }));
      const url = await getFileUrl(filePath);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
    } catch (error) {
      toast.error('Failed to download file');
      console.error(error);
    } finally {
      setLoading(prev => ({ ...prev, ['download']: false }));
    }
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
        <div className="p-4 bg-white/5 rounded-full inline-block">
          <File className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold mt-4">No files found</h3>
        <p className="text-gray-400 mt-2">Try adjusting your filters or search</p>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto bg-white/5 rounded-xl border border-white/10">
        <table className="w-full">
          <thead className="border-b border-white/10">
            <tr>
              <th className="p-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedFiles.length === files.length && files.length > 0}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
                />
              </th>
              <th className="p-4 text-left text-sm font-medium text-gray-400">File</th>
              <th className="p-4 text-left text-sm font-medium text-gray-400">Size</th>
              <th className="p-4 text-left text-sm font-medium text-gray-400">User</th>
              <th className="p-4 text-left text-sm font-medium text-gray-400">Uploaded</th>
              <th className="p-4 text-center text-sm font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => {
              const Icon = getFileIcon(file.type);
              return (
                <tr key={file.id} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => onSelectFile(file.id)}
                      className="h-4 w-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium truncate max-w-[200px]">{file.name}</p>
                        <p className="text-xs text-gray-400">{file.type || 'Unknown type'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm">{formatSize(file.size)}</td>
                  <td className="p-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3 text-gray-400" />
                      <span className="truncate max-w-[120px]">{file.userId?.slice(0, 8)}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      {formatDate(file.uploadedAt)}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleCopyLink(file.url)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                        title="Copy link"
                      >
                        {copyId === Date.now() ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDownload(file.path, file.name)}
                        disabled={loading['download']}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition disabled:opacity-50"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(file.id, file.path)}
                        disabled={loading[file.id]}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition disabled:opacity-50"
                        title="Delete"
                      >
                        {loading[file.id] ? (
                          <div className="h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {files.map((file) => {
          const Icon = getFileIcon(file.type);
          return (
            <div key={file.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file.id)}
                    onChange={() => onSelectFile(file.id)}
                    className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <p className="font-medium truncate max-w-[150px]">{file.name}</p>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-gray-400">
                      <p>{formatSize(file.size)} • {file.type || 'Unknown'}</p>
                      <p className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(file.uploadedAt)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleCopyLink(file.url)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(file.path, file.name)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(file.id, file.path)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center mt-6">
          <button
            onClick={loadMore}
            className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white"
          >
            Load More Files
          </button>
        </div>
      )}
    </div>
  );
};

export default FileTable;