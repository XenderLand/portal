import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../../hooks/useAuth';
import { uploadFile } from '../../services/firebase';
import { toast } from 'react-toastify';
import { Upload, Loader2, CheckCircle, AlertCircle, X,  RefreshCw } from 'lucide-react';

const FileUpload = ({ onUploadComplete, setIsUploading }) => {
  const { user } = useAuth();
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [completedFiles, setCompletedFiles] = useState([]);
  const [failedFiles, setFailedFiles] = useState([]);
  // const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    // Check file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    const validFiles = acceptedFiles.filter(file => file.size <= maxSize);
    
    if (validFiles.length !== acceptedFiles.length) {
      toast.warning('Some files exceed the 100MB limit and were skipped');
    }

    if (validFiles.length === 0) return;

    // Add files to uploading list
    const fileNames = validFiles.map(f => f.name);
    setUploadingFiles(prev => [...prev, ...fileNames]);
    setIsUploading(true);

    for (const file of validFiles) {
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        await uploadFile(file, user.uid, (progress) => {
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        });

        toast.success(`${file.name} uploaded successfully!`);
        
        // Move from uploading to completed
        setUploadingFiles(prev => prev.filter(name => name !== file.name));
        setCompletedFiles(prev => [...prev, file.name]);
        setUploadProgress(prev => {
          const newState = { ...prev };
          delete newState[file.name];
          return newState;
        });

      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
        setUploadingFiles(prev => prev.filter(name => name !== file.name));
        setFailedFiles(prev => [...prev, file.name]);
        setUploadProgress(prev => {
          const newState = { ...prev };
          delete newState[file.name];
          return newState;
        });
      }
    }

    setIsUploading(false);
    onUploadComplete();
  }, [user, setIsUploading, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 100 * 1024 * 1024,
    multiple: true
  });

  const totalFiles = uploadingFiles.length + completedFiles.length + failedFiles.length;

  return (
    <div className="mb-8">
      {/* Dropzone Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-300
          ${isDragActive 
            ? 'border-primary bg-primary/10' 
            : 'border-white/20 hover:border-primary/50 bg-white/5'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className={`p-4 rounded-full transition-all duration-300 ${
            isDragActive ? 'bg-primary/20 animate-pulse' : 'bg-primary/10'
          }`}>
            <Upload className={`h-12 w-12 transition-all duration-300 ${
              isDragActive ? 'text-primary scale-110' : 'text-primary'
            }`} />
          </div>
          <div>
            <p className="text-xl font-semibold">
              {isDragActive ? 'Drop your files here' : 'Drag & drop files here'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              or click to browse • Max 100MB per file
            </p>
            {totalFiles > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                {totalFiles} file{totalFiles > 1 ? 's' : ''} processed
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Status Summary */}
      {(uploadingFiles.length > 0 || completedFiles.length > 0 || failedFiles.length > 0) && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {uploadingFiles.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 text-center">
              <Loader2 className="h-4 w-4 text-yellow-500 animate-spin mx-auto" />
              <span className="text-xs text-yellow-500">{uploadingFiles.length} Uploading</span>
            </div>
          )}
          {completedFiles.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 text-center">
              <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
              <span className="text-xs text-green-500">{completedFiles.length} Completed</span>
            </div>
          )}
          {failedFiles.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-center">
              <AlertCircle className="h-4 w-4 text-red-500 mx-auto" />
              <span className="text-xs text-red-500">{failedFiles.length} Failed</span>
            </div>
          )}
        </div>
      )}

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="mt-4 space-y-3">
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  <span className="text-sm truncate max-w-[200px]">{fileName}</span>
                </div>
                <span className="text-sm font-medium text-primary">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed Files */}
      {completedFiles.length > 0 && (
        <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Successfully Uploaded ({completedFiles.length})
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {completedFiles.map((name) => (
              <div key={name} className="flex items-center justify-between text-sm px-2 py-1 hover:bg-white/5 rounded">
                <span className="text-gray-300 truncate flex-1">{name}</span>
                <CheckCircle className="h-3 w-3 text-green-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed Files */}
      {failedFiles.length > 0 && (
        <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Failed Uploads ({failedFiles.length})
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {failedFiles.map((name) => (
              <div key={name} className="flex items-center justify-between text-sm px-2 py-1 hover:bg-white/5 rounded">
                <span className="text-gray-300 truncate flex-1">{name}</span>
                <button
                  onClick={() => {
                    // Retry the failed upload
                    setFailedFiles(prev => prev.filter(f => f !== name));
                    // Find the file and retry
                    const fileInput = document.querySelector('input[type="file"]');
                    if (fileInput) {
                      const file = fileInput.files?.[0];
                      if (file) {
                        // Re-trigger upload
                        onDrop([file]);
                      }
                    }
                  }}
                  className="text-primary hover:text-primary/80 text-xs flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clear All Button */}
      {totalFiles > 0 && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setUploadingFiles([]);
              setCompletedFiles([]);
              setFailedFiles([]);
              setUploadProgress({});
            }}
            className="text-xs text-gray-400 hover:text-white hover:bg-white/10 px-3 py-1 rounded-lg transition flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;