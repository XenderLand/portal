import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const checkAdmin = async () => {
      if (!user) {
        if (mounted) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (mounted) {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('📄 useAdmin: Role found:', userData.role);
            setIsAdmin(userData.role === 'admin');
          } else {
            // Create user document
            await setDoc(userRef, {
              email: user.email,
              displayName: user.displayName || 'User',
              role: 'user',
              createdAt: serverTimestamp()
            });
            setIsAdmin(false);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('❌ useAdmin: Error:', err);
        if (mounted) {
          setError(err.message);
          setIsAdmin(false);
          setLoading(false);
        }
      }
    };

    checkAdmin();

    return () => {
      mounted = false;
    };
  }, [user]);

  return { isAdmin, loading, error };
};