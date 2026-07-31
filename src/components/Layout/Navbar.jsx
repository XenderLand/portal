import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { logOut } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { toast } from 'react-toastify';
import { Upload, LogOut, User, Shield } from 'lucide-react';

const Navbar = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setIsAdmin(userDoc.data().role === 'admin');
        }
      } catch (error) {
        console.error('Error checking admin:', error);
      }
    };
    checkAdmin();
  }, [user]);

  const handleLogout = async () => {
    try {
      await logOut();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  return (
    <nav className="bg-dark-secondary border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl bg-dark-secondary/80">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <Upload className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Adoo's Private Vault</span>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <>
                <div className="flex items-center gap-2">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName} 
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <span className="text-sm hidden md:block">{user.displayName}</span>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="flex items-center gap-1 px-3 py-1.5 border border-primary text-primary hover:bg-primary/10 rounded-lg transition text-sm"
                  >
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="flex px-3 py-1.5 border border-red-500 hover:bg-red-500/10 rounded-lg transition text-red-500 hover:text-red-400 items-center gap-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;