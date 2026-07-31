import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../../hooks/useAuth';
import { uploadFile } from '../../services/firebase';
import { toast } from 'react-toastify';
import { Upload, File } from 'lucide-react';

const FileUpload = ({ onUploadComplete, setIsUploading }) => {
  const { user } = useAuth();
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadingFiles, setUploadingFiles] = useState([]);

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

    setUploadingFiles(prev => [...prev, ...validFiles.map(f => f.name)]);
    setIsUploading(true);

    for (const file of validFiles) {
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        await uploadFile(file, user.uid, (progress) => {
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        });

        toast.success(`${file.name} uploaded successfully!`);
        
        // Remove from uploading list
        setUploadingFiles(prev => prev.filter(name => name !== file.name));
        setUploadProgress(prev => {
          const newState = { ...prev };
          delete newState[file.name];
          return newState;
        });

      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
        setUploadingFiles(prev => prev.filter(name => name !== file.name));
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

  return (
    <div className="mb-8">
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
          <div className="p-4 bg-primary/10 rounded-full">
            <Upload className="h-12 w-12 text-primary" />
          </div>
          <div>
            <p className="text-xl font-semibold">
              {isDragActive ? 'Drop your files here' : 'Drag & drop files here'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              or click to browse • Max 100MB per file
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="mt-4 space-y-3">
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4 text-gray-400" />
                  <span className="text-sm truncate max-w-[200px]">{fileName}</span>
                </div>
                <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;