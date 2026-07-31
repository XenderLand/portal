import { doc, setDoc, serverTimestamp, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { initializeApp, deleteApp} from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  
} from 'firebase/auth';

// Same config your main app uses — pulled from the already-initialized
// primary app so it never falls out of sync with services/firebase.js
const firebaseConfig = auth.app.options;

export const generateUsername = (firstName = '', lastName = '') => {
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  if (firstName && lastName) {
    const cleanFirstName = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanLastName = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${cleanFirstName}${cleanLastName}${randomNum}`;
  }
  
  const adjectives = ['happy', 'creative', 'brave', 'smart', 'kind', 'lucky', 'swift', 'bright', 'calm', 'bold'];
  const nouns = ['panda', 'tiger', 'eagle', 'dolphin', 'lion', 'wolf', 'phoenix', 'dragon', 'falcon', 'fox'];
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  return `${adj}${noun}${num}`;
};

export const generateUserFriendlyPassword = (length = 10) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  
  if (!/[0-9]/.test(password)) {
    password = password.slice(0, -1) + Math.floor(Math.random() * 10);
  }
  if (!/[A-Z]/.test(password)) {
    password = 'A' + password.slice(1);
  }
  
  return password;
};

export const isUsernameAvailable = async (username) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username.toLowerCase()));
    const snapshot = await getDocs(q);
    return snapshot.empty;
  } catch (error) {
    console.error('Error checking username:', error);
    return false;
  }
};

export const loginWithUsername = async (username, password) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username.toLowerCase()));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error('Username not found');
    }
    
    const userData = snapshot.docs[0].data();
    const email = userData.email;
    
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    return {
      success: true,
      user: result.user,
      username: username
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const loginWithUsernameAlt = async (username, password) => {
  try {
    const email = `${username.toLowerCase()}@${username.toLowerCase()}.app`;
    console.log('🔍 Attempting login with email:', email);
    
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    return {
      success: true,
      user: result.user,
      username: username
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const users = [];
    snapshot.forEach((doc) => {
      users.push({ uid: doc.id, ...doc.data() });
    });
    return users;
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
};

export const getUserPassword = async (uid) => {
  try {
    console.log('🔍 Fetching password for user:', uid);
    
    const docRef = doc(db, 'userCredentials', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.plainTextPassword || null;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting password:', error);
    return null;
  }
};

/**
 * Create a new user WITHOUT logging the admin out.
 *
 * ✅ FIXED: The old approach called createUserWithEmailAndPassword() on the
 * *same* auth instance the admin was signed in on. Firebase's client SDK
 * always signs in as the newly created user when you do that — there's no
 * way to opt out. The previous code tried to patch this after the fact by
 * signing out and signing back in as admin, which needed the admin's
 * plaintext password on every call and left a window where the admin was
 * fully logged out (or stuck as the new user) if anything failed in between.
 *
 * The real fix: create the new user on a throwaway secondary Firebase App
 * instance with its own isolated Auth. The admin's session on the primary
 * `auth` instance is never touched, so there's nothing to restore and no
 * admin password required.
 */
export const createUserCredentials = async (userData) => {
  const {
    username: providedUsername,
    password: providedPassword,
    displayName = '',
    passwordLength = 10,
  } = userData;

  if (!providedUsername) {
    throw new Error('Username is required');
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No user is currently logged in. Please login as admin first.');
  }

  const username = providedUsername.toLowerCase().replace(/[^a-z0-9]/g, '');
  const password = providedPassword || generateUserFriendlyPassword(passwordLength);
  const email = `${username}@${username}.app`;

  // Give the secondary app a unique name so repeated calls don't collide
  const secondaryAppName = `Secondary-${Date.now()}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    console.log('👤 Admin creating user (isolated session):', currentUser.uid);
    console.log('🔑 Creating new user:', username);

    // Create + sign in the new user, but on the SECONDARY auth instance —
    // the admin's session on the primary `auth` instance is untouched.
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const newUser = userCredential.user;
    console.log('✅ New user created:', newUser.uid);

    await updateProfile(newUser, {
      displayName: displayName || username,
    });

    // Firestore writes use the shared `db`, authenticated as the admin
    // via the primary app — this part was never the problem.
    await setDoc(doc(db, 'users', newUser.uid), {
      uid: newUser.uid,
      username: username,
      displayName: displayName || username,
      email: email,
      role: 'user',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: currentUser.uid,
      isActive: true,
    });

    await setDoc(doc(db, 'userCredentials', newUser.uid), {
      username: username,
      email: email,
      plainTextPassword: password,
      createdAt: serverTimestamp(),
      createdBy: currentUser.uid,
    });
    console.log('✅ User + credentials saved');

    // Clean up the secondary session/app — doesn't affect the admin at all
    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);

    return {
      success: true,
      uid: newUser.uid,
      username: username,
      password: password,
      displayName: displayName || username,
      email: email,
      message: 'User created successfully. Admin session was never affected.',
    };
  } catch (error) {
    console.error('❌ Error creating user:', error);

    // Always clean up the secondary app, even on failure
    try {
      await deleteApp(secondaryApp);
    } catch (_) {
      /* already gone */
    }

    if (error.code === 'auth/email-already-in-use') {
      throw new Error('That username is already taken.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak — use at least 6 characters.');
    } else if (error.message?.includes('permission')) {
      throw new Error('Permission denied. Please check Firestore security rules.');
    } else {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }
};