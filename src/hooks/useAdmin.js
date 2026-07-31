import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAdminStatus = useCallback(async () => {
    console.log('🔍 useAdmin: Starting check...');
    console.log('🔍 useAdmin: Current user:', user);

    if (!user) {
      console.log('❌ useAdmin: No user logged in');
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      console.log(`📝 useAdmin: Checking user document for UID: ${user.uid}`);
      
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      console.log('📄 useAdmin: Document exists:', userDoc.exists());
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('📄 useAdmin: Document data:', userData);
        console.log('📄 useAdmin: Role:', userData.role);
        
        const adminStatus = userData.role === 'admin';
        console.log(`👑 useAdmin: Is admin? ${adminStatus}`);
        
        // ✅ FIX: Set state here
        setIsAdmin(adminStatus);
        console.log(`✅ useAdmin: State set to ${adminStatus}`);
      } else {
        console.log('⚠️ useAdmin: User document does not exist, creating one...');
        
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName || 'User',
          role: 'user',
          createdAt: serverTimestamp()
        });
        
        console.log('✅ useAdmin: User document created with role: user');
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('❌ useAdmin: Error checking admin status:', error);
      setError(error.message);
      setIsAdmin(false);
    } finally {
      setLoading(false);
      console.log('🏁 useAdmin: Final state - isAdmin:', isAdmin, 'loading:', loading);
    }
  }, [user, isAdmin, loading ]); // ✅ Add user as dependency

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]); // ✅ Use the memoized function

  return { isAdmin, loading, error };
};