// src/components/Debug/DebugFiles.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { storage, db } from '../../services/firebase';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { collection, getDocs, query, where } from 'firebase/firestore';

const DebugFiles = () => {
    const { user } = useAuth();
  const [storageFiles, setStorageFiles] = useState([]);
  const [firestoreFiles, setFirestoreFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAllFiles = useCallback(async () => {
    if (!user) {
      console.log('No user logged in');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get Storage files
      console.log('📁 Getting Storage files for user:', user.uid);
      const storageRef = ref(storage, `users/${user.uid}`);
      const storageResult = await listAll(storageRef);
      
      const storageList = await Promise.all(
        storageResult.items.map(async (item) => {
          const url = await getDownloadURL(item);
          return {
            name: item.name,
            url: url,
            fullPath: item.fullPath
          };
        })
      );
      setStorageFiles(storageList);
      console.log('📁 Storage files:', storageList.length);
      
      // Get Firestore files
      console.log('📄 Getting Firestore files for user:', user.uid);
      
      // ✅ Query only files for this user
      const q = query(
        collection(db, 'files'),
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const firestoreList = [];
      querySnapshot.forEach((doc) => {
        firestoreList.push({ id: doc.id, ...doc.data() });
      });
      setFirestoreFiles(firestoreList);
      console.log('📄 Firestore files:', firestoreList.length);
      
      // ✅ Compare Storage vs Firestore
      const storageNames = new Set(storageList.map(f => f.name));
      const firestoreNames = new Set(firestoreList.map(f => f.name));
      
      const inStorageNotFirestore = storageList.filter(f => !firestoreNames.has(f.name));
      const inFirestoreNotStorage = firestoreList.filter(f => !storageNames.has(f.name));
      
      if (inStorageNotFirestore.length > 0) {
        console.warn('⚠️ Files in Storage but not Firestore:', inStorageNotFirestore);
      }
      if (inFirestoreNotStorage.length > 0) {
        console.warn('⚠️ Files in Firestore but not Storage:', inFirestoreNotStorage);
      }
      
    } catch (error) {
      console.error('❌ Error loading files:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

   useEffect(() => {
    if (user) {
      loadAllFiles();
    }
  }, [user, loadAllFiles]);

    if (!user) {
    return (
      <div className="p-4 bg-dark rounded-lg border border-white/10">
        <p className="text-gray-400">Please login to view files</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-dark rounded-lg border border-white/10">
      <h3 className="text-lg font-bold mb-4">File Debug</h3>
      
       {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          Error: {error}
        </div>
      )}
   <div className="flex items-center gap-4 mb-4">
        <button
          onClick={loadAllFiles}
          className="px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
        
        <span className="text-sm text-gray-400">
          User: {user.displayName || user.email}
        </span>
      </div>
      
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Storage Files */}
        <div className="bg-white/5 rounded-lg p-3">
          <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
            Storage ({storageFiles.length})
            {loading && <span className="text-xs text-gray-400">loading...</span>}
          </h4>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {storageFiles.length === 0 && !loading && (
              <p className="text-gray-500 text-sm">No files in storage</p>
            )}
            {storageFiles.map((file) => (
              <div key={file.name} className="bg-white/5 p-2 rounded text-xs flex items-center justify-between">
                <span className="truncate flex-1">{file.name}</span>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline ml-2"
                >
                  View
                </a>
              </div>
            ))}
          </div>
        </div>
        
      {/* Firestore Files */}
        <div className="bg-white/5 rounded-lg p-3">
          <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
            Firestore ({firestoreFiles.length})
            {loading && <span className="text-xs text-gray-400">loading...</span>}
          </h4>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {firestoreFiles.length === 0 && !loading && (
              <p className="text-gray-500 text-sm">No files in Firestore</p>
            )}
            {firestoreFiles.map((file) => (
              <div key={file.id} className="bg-white/5 p-2 rounded text-xs">
                <div className="flex items-center justify-between">
                  <span className="truncate flex-1">{file.name}</span>
                  <span className="text-gray-500 text-[10px] ml-2">
                    ID: {file.id.slice(0, 8)}
                  </span>
                </div>
                <div className="text-gray-500 text-[10px] mt-1">
                  userId: {file.userId?.slice(0, 8)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Summary */}
      {!loading && storageFiles.length > 0 && firestoreFiles.length > 0 && (
        <div className="mt-4 p-3 bg-white/5 rounded-lg">
          <p className="text-sm text-gray-400">
            Storage: {storageFiles.length} files | Firestore: {firestoreFiles.length} files
            {storageFiles.length !== firestoreFiles.length && (
              <span className="text-yellow-400 ml-2">
                ⚠️ Mismatch: {Math.abs(storageFiles.length - firestoreFiles.length)} file(s) difference
              </span>
            )}
            {storageFiles.length === firestoreFiles.length && storageFiles.length > 0 && (
              <span className="text-green-400 ml-2">✅ All files match!</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default DebugFiles;