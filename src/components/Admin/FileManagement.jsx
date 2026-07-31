import React, { useState, useEffect } from 'react';
import FileTable from './FileTable';
import FileFilters from './FileFilters';
import BulkActions from './BulkActions';
import { adminBulkDeleteFiles, exportFilesCSV } from '../../services/adminFirebase';
import { toast } from 'react-toastify';
import { Download, RefreshCw,  Search } from 'lucide-react';

const FileManagement = ({ files, onFileDelete, onFileUpdate, loadMore, hasMore }) => {
  const [filteredFiles, setFilteredFiles] = useState(files);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ type: '', dateRange: '', user: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let filtered = files;

    // Search
    if (searchTerm) {
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.userId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter(file => file.type === filters.type);
    }

    // Date filter
    if (filters.dateRange) {
      const now = new Date();
      const filterDate = new Date();
      switch (filters.dateRange) {
        case 'today':
          filterDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          break;
      }
      filtered = filtered.filter(file => {
        const uploadDate = file.uploadedAt?.toDate?.() || new Date(file.uploadedAt);
        return uploadDate >= filterDate;
      });
    }

    setFilteredFiles(filtered);
  }, [files, searchTerm, filters]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedFiles(filteredFiles.map(f => f.id));
    } else {
      setSelectedFiles([]);
    }
  };

  const handleSelectFile = (fileId) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedFiles.length} files?`)) return;
    
    try {
      setIsLoading(true);
      await adminBulkDeleteFiles(selectedFiles);
      toast.success(`${selectedFiles.length} files deleted successfully`);
      setSelectedFiles([]);
      // Refresh files
      window.location.reload();
    } catch (error) {
      toast.error('Failed to delete files');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);
      const data = await exportFilesCSV();
      
      // Create CSV
      const csvContent = [
        data.headers.join(','),
        ...data.rows.map(row => row.join(','))
      ].join('\n');
      
      // Download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `files_export_${new Date().toISOString()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Files exported successfully');
    } catch (error) {
      toast.error('Failed to export files');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">File Management</h2>
          <span className="text-sm text-gray-400">({filteredFiles.length} files)</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={() => window.location.reload()}
            className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 rounded-lg border border-white/10 focus:border-primary/50 focus:outline-none text-white placeholder-gray-400"
          />
        </div>
        
        <select
          value={filters.type}
          onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
          className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 focus:border-primary/50 focus:outline-none text-white"
        >
          <option value="">All Types</option>
          <option value="application/pdf">PDF</option>
          <option value="image/jpeg">JPEG</option>
          <option value="image/png">PNG</option>
          <option value="application/msword">DOC</option>
          <option value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">DOCX</option>
        </select>
        
        <select
          value={filters.dateRange}
          onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
          className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 focus:border-primary/50 focus:outline-none text-white"
        >
          <option value="">All Time</option>
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="year">Last Year</option>
        </select>

        {selectedFiles.length > 0 && (
          <BulkActions 
            selectedCount={selectedFiles.length}
            onDelete={handleBulkDelete}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* File Table */}
      <FileTable 
        files={filteredFiles}
        selectedFiles={selectedFiles}
        onSelectFile={handleSelectFile}
        onSelectAll={handleSelectAll}
        onFileDelete={onFileDelete}
        onFileUpdate={onFileUpdate}
        loadMore={loadMore}
        hasMore={hasMore}
      />
    </div>
  );
};

export default FileManagement;