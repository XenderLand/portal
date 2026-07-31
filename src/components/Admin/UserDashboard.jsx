import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import FileUpload from '../Dashboard/FileUpload';
import FileList from '../Dashboard/FileList';
import { listenToUserFiles } from '../../services/firebase';
import {  FolderOpen, HardDrive, Shield, Loader2 } from 'lucide-react';

const UserDashboard = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    console.log('🔄 Setting up file listener for user:', user.uid);
    setLoading(true);
    
    const unsubscribe = listenToUserFiles(user.uid, (fetchedFiles) => {
      console.log('📄 Files received:', fetchedFiles.length);
      setFiles(fetchedFiles);
      setLoading(false);
    });

    return () => {
      console.log('🧹 Cleaning up file listener');
      unsubscribe();
    };
  }, [user, refreshTrigger]);

  const handleUploadComplete = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    setIsUploading(false);
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const totalSize = files.reduce((acc, file) => acc + (file.size || 0), 0);
  const formattedSize = totalSize > 0 ? (totalSize / (1024 * 1024)).toFixed(2) : '0';

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 mt-4">Loading your files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* User Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            Welcome, {user?.displayName || 'User'}!
          </h1>
          <p className="text-gray-400 mt-1">Upload and manage your files securely</p>
        </div>

        {/* Uploading Indicator */}
        {isUploading && (
          <div className="fixed top-20 right-4 z-50 bg-primary/10 border border-primary/30 rounded-xl px-6 py-3 flex items-center gap-3 animate-pulse">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
            <span className="text-white font-medium">Uploading files...</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-8 w-8 text-primary" />
              <div>
                <p className="text-gray-400 text-sm">Total Files</p>
                <p className="text-2xl font-bold">{files.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3">
              <HardDrive className="h-8 w-8 text-primary" />
              <div>
                <p className="text-gray-400 text-sm">Storage Used</p>
                <p className="text-2xl font-bold">{formattedSize} MB</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <p className="text-gray-400 text-sm">Security</p>
                <p className="text-2xl font-bold">🔒 Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <FileUpload 
          onUploadComplete={handleUploadComplete}
          setIsUploading={setIsUploading}
        />

        {/* File List */}
        <FileList 
          files={files} 
          refreshTrigger={refreshTrigger}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
};

export default UserDashboard;