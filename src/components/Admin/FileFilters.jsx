import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../../services/firebase';
import { toast } from 'react-toastify';
import { Upload, ArrowRight, Loader2, Shield } from 'lucide-react';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const navigate = useNavigate();
  const isMounted = useRef(true);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleGoogleSignIn = async () => {
    // ✅ Prevent multiple clicks
    if (loading) return;
    
    try {
      setLoading(true);
      
      // ✅ Show loading toast
      const toastId = toast.loading('Signing in with Google...');
      
      const result = await signInWithGoogle();
      
      // ✅ Dismiss loading toast
      toast.dismiss(toastId);
      
      if (isMounted.current) {
        toast.success(`Welcome${result.user.displayName ? `, ${result.user.displayName}` : ''}! 🚀`);
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      
      // ✅ Handle specific errors
      if (error.code === 'auth/popup-closed-by-user') {
        toast.warning('Sign-in cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Popup was blocked. Please allow popups for this site.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        toast.info('Sign-in request cancelled.');
      } else {
        toast.error(error.message || 'Failed to sign in with Google');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.warning('Please enter both email and password');
      return;
    }
    
    if (loading) return;
    
    try {
      setLoading(true);
      const toastId = toast.loading('Signing in...');
      
      // ✅ Use email/password sign in
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('../../services/firebase');
      
      await signInWithEmailAndPassword(auth, email, password);
      
      toast.dismiss(toastId);
      toast.success('Welcome back! 🚀');
      navigate('/dashboard');
    } catch (error) {
      console.error('Email Sign-In Error:', error);
      
      if (error.code === 'auth/user-not-found') {
        toast.error('No account found with this email');
      } else if (error.code === 'auth/wrong-password') {
        toast.error('Incorrect password');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many failed attempts. Please try again later.');
      } else {
        toast.error(error.message || 'Failed to sign in');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
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
          <p className="text-gray-400 mt-2">Sign in to access your secure upload portal</p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white text-dark px-6 py-3 rounded-xl font-semibold hover:bg-white/90 transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed relative"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-dark text-gray-400">or</span>
            </div>
          </div>

          {/* Email Login Toggle */}
          <button
            onClick={() => setShowEmailLogin(!showEmailLogin)}
            className="w-full text-center text-sm text-gray-400 hover:text-white transition"
          >
            {showEmailLogin ? '← Back to Google Sign In' : 'Sign in with Email'}
          </button>

          {/* Email Login Form */}
          {showEmailLogin && (
            <form onSubmit={handleEmailSignIn} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 bg-white/5 rounded-lg border border-white/10 focus:border-primary/50 focus:outline-none text-white placeholder-gray-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2 bg-white/5 rounded-lg border border-white/10 focus:border-primary/50 focus:outline-none text-white placeholder-gray-400"
                  required
                  minLength="6"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-black py-2 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          )}

          {/* Security Info */}
          <div className="mt-6 space-y-2 text-sm text-gray-400 text-center border-t border-white/10 pt-4">
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>Secure & Encrypted</span>
            </div>
            <p className="text-xs text-gray-500">
              By signing in, you agree to our Terms of Service
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;