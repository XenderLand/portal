import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { logOut } from '../../services/firebase';
import { toast } from 'react-toastify';
import { Upload, LogOut, User, Shield } from 'lucide-react';

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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
            <span className="font-bold text-lg">SecureUpload</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm text-gray-400">Secure</span>
            </div>
            
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
                  <span className="text-sm hidden md:block">{user.displayName || 'User'}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
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