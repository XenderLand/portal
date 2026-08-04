import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../../hooks/useAuth';
import { uploadFile } from '../../services/firebase';
import { toast } from 'react-toastify';
import {
  Upload,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  File as FileIcon,
} from 'lucide-react';

// Maps a MIME type / filename to an icon + color for display purposes.
// Falls back to a generic file icon for anything unrecognized.
const getFileTypeDisplay = (type = '', name = '') => {
  const ext = name.split('.').pop()?.toLowerCase() || '';

  if (type.startsWith('image/')) {
    return { icon: FileImage, color: 'text-purple-400', label: 'Image' };
  }
  if (type.startsWith('video/')) {
    return { icon: FileVideo, color: 'text-pink-400', label: 'Video' };
  }
  if (type.startsWith('audio/')) {
    return { icon: FileAudio, color: 'text-blue-400', label: 'Audio' };
  }
  if (type === 'application/pdf' || ext === 'pdf') {
    return { icon: FileText, color: 'text-red-400', label: 'PDF' };
  }
  if (
    ['xls', 'xlsx', 'csv'].includes(ext) ||
    type.includes('spreadsheet') ||
    type === 'text/csv'
  ) {
    return { icon: FileSpreadsheet, color: 'text-green-400', label: 'Spreadsheet' };
  }
  if (['doc', 'docx'].includes(ext) || type.includes('wordprocessingml') || type === 'application/msword') {
    return { icon: FileText, color: 'text-blue-400', label: 'Document' };
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return { icon: FileArchive, color: 'text-yellow-400', label: 'Archive' };
  }
  if (['js', 'jsx', 'ts', 'tsx', 'json', 'html', 'css', 'py', 'java'].includes(ext)) {
    return { icon: FileCode, color: 'text-cyan-400', label: 'Code' };
  }
  return { icon: FileIcon, color: 'text-gray-400', label: 'File' };
};

// Small reusable thumbnail: shows an actual image preview for image files,
// otherwise falls back to a type-appropriate icon.
const FileThumbnail = ({ name, type, previewUrl, size = 'h-8 w-8' }) => {
  const { icon: Icon, color } = getFileTypeDisplay(type, name);

  if (type?.startsWith('image/') && previewUrl) {
    return (
      <img
        src={previewUrl}
        alt={name}
        className={`${size} rounded object-cover border border-white/10 shrink-0`}
      />
    );
  }

  return (
    <div className={`${size} rounded bg-white/5 border border-white/10 flex items-center justify-center shrink-0`}>
      <Icon className={`h-4 w-4 ${color}`} />
    </div>
  );
};

const FileUpload = ({ onUploadComplete, setIsUploading }) => {
  const { user } = useAuth();
  const [uploadProgress, setUploadProgress] = useState({});
  // Each entry: { name, type, size, previewUrl }
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [completedFiles, setCompletedFiles] = useState([]);
  const [failedFiles, setFailedFiles] = useState([]);

  const onDrop = useCallback(async (acceptedFiles) => {
    console.log('📥 Files dropped:', acceptedFiles);

    if (!user) {
      console.error('❌ No user logged in');
      toast.error('Please sign in first');
      return;
    }

    console.log('👤 Current user:', user.uid, user.email);

    // Check file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    const validFiles = acceptedFiles.filter((file) => file.size <= maxSize);

    if (validFiles.length !== acceptedFiles.length) {
      toast.warning('Some files exceed the 100MB limit and were skipped');
    }

    if (validFiles.length === 0) return;

    // Build lightweight metadata (+ a local object URL for image previews)
    // so the file list can show a thumbnail without re-reading the file.
    const fileMetas = validFiles.map((file) => ({
      name: file.name,
      type: file.type || 'unknown',
      size: file.size,
      previewUrl: file.type?.startsWith('image/') ? URL.createObjectURL(file) : null,
    }));

    setUploadingFiles((prev) => [...prev, ...fileMetas]);
    setIsUploading(true);

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const meta = fileMetas[i];

      try {
        console.log(`📤 Uploading: ${file.name} (${file.size} bytes)`);
        setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

        await uploadFile(file, user.uid, (progress) => {
          setUploadProgress((prev) => ({ ...prev, [file.name]: progress }));
        });

        console.log(`✅ Uploaded: ${file.name}`);
        toast.success(`${file.name} uploaded successfully!`);

        setUploadingFiles((prev) => prev.filter((f) => f.name !== file.name));
        setCompletedFiles((prev) => [...prev, meta]);
        setUploadProgress((prev) => {
          const newState = { ...prev };
          delete newState[file.name];
          return newState;
        });
      } catch (error) {
        console.error(`❌ Failed to upload ${file.name}:`, error);
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
        setUploadingFiles((prev) => prev.filter((f) => f.name !== file.name));
        setFailedFiles((prev) => [...prev, meta]);
        setUploadProgress((prev) => {
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
    multiple: true,
  });

  const totalFiles = uploadingFiles.length + completedFiles.length + failedFiles.length;

  const clearAll = () => {
    // Release object URLs before clearing to avoid memory leaks
    [...uploadingFiles, ...completedFiles, ...failedFiles].forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setUploadingFiles([]);
    setCompletedFiles([]);
    setFailedFiles([]);
    setUploadProgress({});
  };

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
          {uploadingFiles
            .filter((f) => f.name in uploadProgress)
            .map((f) => (
              <div key={f.name} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileThumbnail name={f.name} type={f.type} previewUrl={f.previewUrl} size="h-6 w-6" />
                    <span className="text-sm truncate max-w-[200px]">{f.name}</span>
                  </div>
                  <span className="text-sm font-medium text-primary shrink-0">
                    {Math.round(uploadProgress[f.name])}%
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress[f.name]}%` }}
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
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {completedFiles.map((f) => (
              <div key={f.name} className="flex items-center gap-2 text-sm px-2 py-1 hover:bg-white/5 rounded">
                <FileThumbnail name={f.name} type={f.type} previewUrl={f.previewUrl} size="h-7 w-7" />
                <span className="text-gray-300 truncate flex-1">{f.name}</span>
                <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
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
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {failedFiles.map((f) => (
              <div key={f.name} className="flex items-center gap-2 text-sm px-2 py-1 hover:bg-white/5 rounded">
                <FileThumbnail name={f.name} type={f.type} previewUrl={f.previewUrl} size="h-7 w-7" />
                <span className="text-gray-300 truncate flex-1">{f.name}</span>
                <button
                  onClick={() => {
                    // Retry the failed upload
                    setFailedFiles((prev) => prev.filter((x) => x.name !== f.name));
                    const fileInput = document.querySelector('input[type="file"]');
                    if (fileInput) {
                      const file = fileInput.files?.[0];
                      if (file) {
                        onDrop([file]);
                      }
                    }
                  }}
                  className="text-primary hover:text-primary/80 text-xs flex items-center gap-1 shrink-0"
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
            onClick={clearAll}
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
