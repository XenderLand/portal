import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc, doc, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FB_API_KEY,
  authDomain: process.env.REACT_APP_FB_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FB_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FB_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FB_MESSAGIN_SENDER_ID,
  appId: process.env.REACT_APP_FB_APP_ID,
  measurementId: process.env.REACT_APP_FB_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);

// Auth Providers
export const googleProvider = new GoogleAuthProvider();

// Auth Functions
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logOut = () => signOut(auth);

// Storage Functions
export const uploadFile = async (file, userId, onProgress) => {
  const fileId = `${Date.now()}_${file.name}`;
  const storageRef = ref(storage, `users/${userId}/${fileId}`);
  
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      (error) => {
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        
        // Save file metadata to Firestore
        const fileData = {
          name: file.name,
          size: file.size,
          type: file.type,
          url: downloadURL,
          path: `users/${userId}/${fileId}`,
          userId: userId,
          uploadedAt: serverTimestamp(),
          fileId: fileId
        };
        
        const docRef = await addDoc(collection(db, 'files'), fileData);
        resolve({ ...fileData, id: docRef.id });
      }
    );
  });
};

export const getUserFiles = (userId) => {
  const q = query(
    collection(db, 'files'),
    where('userId', '==', userId),
    orderBy('uploadedAt', 'desc')
  );
  return getDocs(q);
};

export const deleteFile = async (fileId, filePath) => {
  // Delete from Storage
  const storageRef = ref(storage, filePath);
  await deleteObject(storageRef);
  
  // Delete from Firestore
  await deleteDoc(doc(db, 'files', fileId));
};

export const listenToUserFiles = (userId, callback) => {
  const q = query(
    collection(db, 'files'),
    where('userId', '==', userId),
    orderBy('uploadedAt', 'desc')
  );
  return onSnapshot(q, (snapshot) => {
    const files = [];
    snapshot.forEach((doc) => {
      files.push({ id: doc.id, ...doc.data() });
    });
    callback(files);
  });
};