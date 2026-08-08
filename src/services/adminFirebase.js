import { 
  db, 
  storage, 
} from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  deleteDoc, 
  updateDoc, 
  orderBy, 
  limit, 
  startAfter, 
  serverTimestamp,

  writeBatch
} from 'firebase/firestore';
import { 
  ref, 
  deleteObject, 
  getDownloadURL,
//   listAll
} from 'firebase/storage';
// import { 
//   signInWithEmailAndPassword,
//   createUserWithEmailAndPassword,
//   deleteUser,
//   updateProfile
// } from 'firebase/auth';

// ===================== FILE MANAGEMENT =====================

// Get all files with pagination
export const getAllFiles = async (pageSize = 20, lastDoc = null) => {
  try {
    let q = query(
      collection(db, 'files'),
      orderBy('uploadedAt', 'desc'),
      limit(pageSize)
    );

    if (lastDoc) {
      q = query(
        collection(db, 'files'),
        orderBy('uploadedAt', 'desc'),
        startAfter(lastDoc),
        limit(pageSize)
      );
    }

    const snapshot = await getDocs(q);
    const files = [];
    let lastVisible = null;

    snapshot.forEach((doc) => {
      files.push({ id: doc.id, ...doc.data() });
      lastVisible = doc;
    });

    return { files, lastVisible };
  } catch (error) {
    console.error('Error getting files:', error);
    throw error;
  }
};

// Get files by user
export const getFilesByUser = async (userId) => {
  try {
    const q = query(
      collection(db, 'files'),
      where('userId', '==', userId),
      orderBy('uploadedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const files = [];
    snapshot.forEach((doc) => {
      files.push({ id: doc.id, ...doc.data() });
    });
    return files;
  } catch (error) {
    console.error('Error getting user files:', error);
    throw error;
  }
};

export const getUserFiles = async (userId) => {
  try {
    const q = query(
      collection(db, 'files'),
      where('userId', '==', userId),
      orderBy('uploadedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const files = [];
    snapshot.forEach((doc) => {
      files.push({ id: doc.id, ...doc.data() });
    });
    return files;
  } catch (error) {
    console.error('Error getting user files:', error);
    throw error;
  }
};


// Get all users
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const users = [];
    snapshot.forEach((doc) => {
      users.push({ 
        uid: doc.id, 
        ...doc.data() 
      });
    });
    return users;
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
};

// Get all users
// export const getAllUserCredentials = async () => {
//   try {
//     const CredentialsRef = collection(db, 'usersCredentials');
//     const snapshot = await getDocs(CredentialsRef);
//     const credentials = [];
//     snapshot.forEach((doc) => {
//       credentials.push({ 
//         uid: doc.id, 
//         ...doc.data() 
//       });
//     });
//     return credentials;
//   } catch (error) {
//     console.error('Error getting credentials:', error);
//     throw error;
//   }
// };

// Get user by ID
export const getUserById = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};


// Get file download URL
export const getFileUrl = async (filePath) => {
  try {
    const storageRef = ref(storage, filePath);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw error;
  }
};

// ===================== USER MANAGEMENT =====================

// Get user stats
export const getUserStats = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const filesSnapshot = await getDocs(collection(db, 'files'));
    
    let totalSize = 0;
    const fileTypes = {};
    const uploadsByDay = {};
    
    filesSnapshot.forEach((doc) => {
      const data = doc.data();
      totalSize += data.size || 0;
      
      // Count file types
      const type = data.type || 'unknown';
      fileTypes[type] = (fileTypes[type] || 0) + 1;
      
      // Count uploads by day
      if (data.uploadedAt) {
        const date = data.uploadedAt.toDate ? 
          data.uploadedAt.toDate().toDateString() : 
          new Date(data.uploadedAt).toDateString();
        uploadsByDay[date] = (uploadsByDay[date] || 0) + 1;
      }
    });
    
    return {
      totalUsers: usersSnapshot.size,
      totalFiles: filesSnapshot.size,
      totalStorage: totalSize,
      fileTypes,
      uploadsByDay
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw error;
  }
};


// Delete user (admin)
export const adminDeleteUser = async (userId) => {
  try {
    // Get all user files
    const userFiles = await getUserFiles(userId);
    
    // Delete each file from storage and Firestore
    for (const file of userFiles) {
      // Delete from storage
      const storageRef = ref(storage, file.path);
      await deleteObject(storageRef);
      
      // Delete from Firestore
      const fileRef = doc(db, 'files', file.id);
      await deleteDoc(fileRef);
    }
    
    // Delete user from Firestore
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    
    return { success: true, message: 'User deleted successfully' };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Delete a file (admin)
export const adminDeleteFile = async (fileId, filePath) => {
  try {
    // Delete from Storage
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
    
    // Delete from Firestore
    await deleteDoc(doc(db, 'files', fileId));
    
    return { success: true, message: 'File deleted successfully' };
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Delete multiple files (bulk)
export const adminBulkDeleteFiles = async (fileIds) => {
  try {
    const batch = writeBatch(db);
    
    for (const fileId of fileIds) {
      // Get file data first to delete from storage
      const fileRef = doc(db, 'files', fileId);
      const fileDoc = await getDoc(fileRef);
      
      if (fileDoc.exists()) {
        const fileData = fileDoc.data();
        // Delete from storage
        const storageRef = ref(storage, fileData.path);
        await deleteObject(storageRef);
        // Delete from Firestore
        batch.delete(fileRef);
      }
    }
    
    await batch.commit();
    return { success: true, message: `${fileIds.length} files deleted successfully` };
  } catch (error) {
    console.error('Error bulk deleting files:', error);
    throw error;
  }
};

// Update file metadata (admin)
export const adminUpdateFile = async (fileId, updateData) => {
  try {
    const fileRef = doc(db, 'files', fileId);
    await updateDoc(fileRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
      updatedBy: 'admin'
    });
    return { success: true, message: 'File updated successfully' };
  } catch (error) {
    console.error('Error updating file:', error);
    throw error;
  }
};

// Update user role
export const updateUserRole = async (userId, newRole) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: serverTimestamp(),
      updatedBy: 'admin'
    });
    return { success: true, message: `User role updated to ${newRole}` };
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// ===================== ANALYTICS =====================

// Get file analytics
export const getFileAnalytics = async () => {
  try {
    const filesSnapshot = await getDocs(collection(db, 'files'));
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    let totalSize = 0;
    const fileTypes = {};
    const uploadsByMonth = {};
    const usersWithFiles = new Set();
    
    filesSnapshot.forEach((doc) => {
      const data = doc.data();
      totalSize += data.size || 0;
      usersWithFiles.add(data.userId);
      
      const type = data.type || 'unknown';
      fileTypes[type] = (fileTypes[type] || 0) + 1;
      
      if (data.uploadedAt) {
        const date = data.uploadedAt.toDate ? 
          data.uploadedAt.toDate() : 
          new Date(data.uploadedAt);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        uploadsByMonth[month] = (uploadsByMonth[month] || 0) + 1;
      }
    });
    
    return {
      totalFiles: filesSnapshot.size,
      totalUsers: usersSnapshot.size,
      activeUsers: usersWithFiles.size,
      totalStorage: totalSize,
      averageFileSize: filesSnapshot.size > 0 ? totalSize / filesSnapshot.size : 0,
      fileTypes,
      uploadsByMonth,
      storageByType: fileTypes
    };
  } catch (error) {
    console.error('Error getting analytics:', error);
    throw error;
  }
};

// ===================== EXPORT DATA =====================

// Export all files data as CSV
export const exportFilesCSV = async () => {
  try {
    const files = await getAllFiles();
    const headers = ['ID', 'Name', 'Size', 'Type', 'User ID', 'Uploaded At', 'URL'];
    
    const rows = files.files.map(file => [
      file.id,
      file.name,
      file.size,
      file.type,
      file.userId,
      file.uploadedAt?.toDate?.()?.toISOString() || file.uploadedAt,
      file.url
    ]);
    
    return { headers, rows };
  } catch (error) {
    console.error('Error exporting files:', error);
    throw error;
  }
};





// Update user (admin)
export const adminUpdateUser = async (userId, updateData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
      updatedBy: 'admin'
    });
    return { success: true, message: 'User updated successfully' };
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};



