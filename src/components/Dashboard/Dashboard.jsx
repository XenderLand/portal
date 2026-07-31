import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import FileUpload from './FileUpload';
import FileList from './FileList';
import { listenToUserFiles } from '../../services/firebase';
import { Upload, FolderOpen, Users, Settings, Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = listenToUserFiles(user.uid, (fetchedFiles) => {
      setFiles(fetchedFiles);
    });

    return () => unsubscribe();
  }, [user]);

  const handleUploadComplete = () => {
    setRefreshTrigger(prev => prev + 1);
    setIsUploading(false);
  };

  const totalSize = files.reduce((acc, file) => acc + file.size, 0);
  const formattedSize = totalSize > 0 ? (totalSize / (1024 * 1024)).toFixed(2) : '0';

  return (
    <div className="min-h-screen bg-dark">
      <div className="max-w-7xl mx-auto px-4 py-8">

         {isUploading && (
          <div className="fixed top-20 right-4 z-50 bg-primary/10 border border-primary/30 rounded-xl px-6 py-3 flex items-center gap-3 animate-pulse">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
            <span className="text-white font-medium">Uploading files...</span>
          </div>
        )}
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
              <Upload className="h-8 w-8 text-primary" />
              <div>
                <p className="text-gray-400 text-sm">Storage Used</p>
                <p className="text-2xl font-bold">{formattedSize} MB</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-gray-400 text-sm">Account Type</p>
                <p className="text-2xl font-bold">Pro</p>
              </div>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8 text-primary" />
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
        />
      </div>
    </div>
  );
};

export default Dashboard;