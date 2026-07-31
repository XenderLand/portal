import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithUsernameAlt } from '../../utils/credentialGenerator'; // ✅ Use Alt version
import { toast } from 'react-toastify';
import { Upload, User, Lock, ArrowRight, Loader2, Shield, Eye, EyeOff } from 'lucide-react';

const UsernameLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.warning('Please enter both username and password');
      return;
    }
    
    if (loading) return;
    
    try {
      setLoading(true);
      const toastId = toast.loading('Signing in...');
      
      // ✅ Use loginWithUsernameAlt (no Firestore read required)
      const result = await loginWithUsernameAlt(username, password);
      
      toast.dismiss(toastId);
      toast.success(`Welcome${result.user.displayName ? `, ${result.user.displayName}` : ''}! 🚀`);
      
      // ✅ Check if user is admin
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../../services/firebase');
        const userRef = doc(db, 'users', result.user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Error checking role:', error);
        navigate('/dashboard');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.message === 'Username not found') {
        toast.error('Username not found. Please check your username.');
      } else if (error.message.includes('password') || error.message.includes('wrong-password')) {
        toast.error('Incorrect password. Please try again.');
      } else if (error.message === 'Permission denied. Please contact your administrator.') {
        toast.error('Permission denied. Please contact your administrator.');
      } else {
        toast.error(error.message || 'Failed to sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/5 p-4 rounded-2xl">
            <Upload className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              Secure Upload
            </span>
          </div>
          <h2 className="text-2xl font-bold mt-6">Welcome Back</h2>
          <p className="text-gray-400 mt-2">Sign in with your username and password</p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Username
                </span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                placeholder="Enter your username"
                className="w-full px-4 py-2 bg-white/5 rounded-lg border border-white/10 focus:border-primary/50 focus:outline-none text-white"
                required
                autoFocus
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                <span className="flex items-center gap-1">
                  <Lock className="h-4 w-4" />
                  Password
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2 bg-white/5 rounded-lg border border-white/10 focus:border-primary/50 focus:outline-none text-white pr-10"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-black py-3 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Info */}
          <div className="mt-6 space-y-2 text-sm text-gray-400 text-center border-t border-white/10 pt-4">
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Secure & Encrypted</span>
            </div>
            <p className="text-xs text-gray-500">
              Secure upload portal for your files
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsernameLogin;