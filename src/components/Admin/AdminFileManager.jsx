import React, { useState, useEffect } from 'react';
import {  deleteFile } from '../../services/firebase';
import { getAllFiles } from '../../services/adminFirebase';

import { toast } from 'react-toastify';
import { File, Download, Trash2, Copy, Check, Calendar, User, Search, RefreshCw } from 'lucide-react';

const AdminFileManager = ({ refreshTrigger }) => {
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const result = await getAllFiles();
      setFiles(result.files);
      setFilteredFiles(result.files);
    } catch (error) {
      toast.error('Failed to load files');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [refreshTrigger]);

  useEffect(() => {
    let filtered = files;
    if (searchTerm) {
      filtered = files.filter(file => 
        file.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.userId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredFiles(filtered);
  }, [searchTerm, files]);

  const handleDelete = async (fileId, filePath) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    
    try {
      setDeleting(fileId);
      await deleteFile(fileId, filePath);
      toast.success('File deleted successfully');
      loadFiles();
    } catch (error) {
      toast.error('Failed to delete file');
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search files by name or user ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 rounded-lg border border-white/10 focus:border-primary/50 focus:outline-none text-white placeholder-gray-400"
          />
        </div>
        <button
          onClick={loadFiles}
          className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="p-4 text-left text-sm font-medium text-gray-400">File</th>
                <th className="p-4 text-left text-sm font-medium text-gray-400">Size</th>
                <th className="p-4 text-left text-sm font-medium text-gray-400">User</th>
                <th className="p-4 text-left text-sm font-medium text-gray-400">Uploaded</th>
                <th className="p-4 text-center text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-3">
                      <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading files...
                    </div>
                  </td>
                </tr>
              ) : filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400">
                    <File className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                    No files found
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => (
                  <tr key={file.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <File className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium truncate max-w-[200px]">{file.name}</p>
                          <p className="text-xs text-gray-400">{file.type || 'Unknown'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm">{formatSize(file.size)}</td>
                    <td className="p-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="truncate max-w-[120px]">{file.userId?.slice(0, 12)}...</span>
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminFileManager;