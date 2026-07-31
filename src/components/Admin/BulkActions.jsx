import React from 'react';
import { Trash2, Download, Share2, Archive, X } from 'lucide-react';

const BulkActions = ({ selectedCount, onDelete, onArchive, onExport, onShare, isLoading }) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-dark-secondary border border-white/20 rounded-2xl shadow-2xl p-3 flex items-center gap-3 animate-slide-up">
      <span className="text-sm text-gray-400 px-2">
        {selectedCount} selected
      </span>
      
      <div className="h-6 w-px bg-white/10" />
      
      <button
        onClick={onDelete}
        disabled={isLoading}
        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition disabled:opacity-50"
        title="Delete selected"
      >
        <Trash2 className="h-4 w-4" />
      </button>
      
      <button
        onClick={onExport}
        disabled={isLoading}
        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition disabled:opacity-50"
        title="Export selected"
      >
        <Download className="h-4 w-4" />
      </button>
      
      <button
        onClick={onShare}
        className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/10 rounded-lg transition"
        title="Share selected"
      >
        <Share2 className="h-4 w-4" />
      </button>
      
      <button
        onClick={onArchive}
        className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 rounded-lg transition"
        title="Archive selected"
      >
        <Archive className="h-4 w-4" />
      </button>
      
      <div className="h-6 w-px bg-white/10" />
      
      <button
        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
        title="Clear selection"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default BulkActions;