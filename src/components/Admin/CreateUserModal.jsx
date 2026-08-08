import React, { useState } from 'react';
import { createUserCredentials, generateUserFriendlyPassword, isUsernameAvailable } from '../../utils/credentialGenerator';
import { toast } from 'react-toastify';
import { X, UserPlus, Copy, Eye, EyeOff, RefreshCw, User, Check, AlertCircle, Key } from 'lucide-react';

const CreateUserModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    passwordLength: 10,
    autoGeneratePassword: true
  });
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const handleGeneratePassword = () => {
    const password = generateUserFriendlyPassword(formData.passwordLength);
    setGeneratedPassword(password);
    setFormData(prev => ({ ...prev, password: password }));
  };

  const handleCopyPassword = () => {
    const passwordToCopy = formData.password || generatedPassword;
    navigator.clipboard.writeText(passwordToCopy);
    setCopied(true);
    toast.success('Password copied to clipboard');
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const checkUsername = async (username) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    
    setCheckingUsername(true);
    try {
      const available = await isUsernameAvailable(username);
      setUsernameAvailable(available);
    } catch (error) {
      console.error('Error checking username:', error);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
    setFormData(prev => ({ ...prev, username: value }));
    checkUsername(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username) {
      toast.warning('Username is required');
      return;
    }

    if (formData.username.length < 3) {
      toast.warning('Username must be at least 3 characters');
      return;
    }

    if (usernameAvailable === false) {
      toast.warning('Username is already taken');
      return;
    }

    try {
      setLoading(true);
      
      const result = await createUserCredentials({
        username: formData.username,
        password: formData.password || undefined,
        passwordLength: formData.passwordLength
      });
      
      setGeneratedPassword(result.password);
      
      toast.success(
        <div>
          <div className="font-bold text-lg">User Created!</div>
          <div className="mt-2 space-y-1">
            <div><span className="text-gray-400">Username:</span> <span className="font-mono text-primary">{result.username}</span></div>
            <div><span className="text-gray-400">Password:</span> <span className="font-mono text-yellow-400">{result.password}</span></div>
          </div>
        </div>,
        { autoClose: 15000 }
      );
      
      setFormData({
        username: '',
        password: '',
        passwordLength: 10,
        autoGeneratePassword: true
      });
      setUsernameAvailable(null);
      setGeneratedPassword('');
      setShowPassword(false);
      
         
    } catch (error) {
      console.error('Create user error:', error);
      
      if (error.message.includes('already taken')) {
        toast.error(error.message);
      } else if (error.message.includes('permission')) {
        toast.error('Permission denied. Please check Firestore security rules.');
      } else {
        toast.error(error.message || 'Failed to create user');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-secondary rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
        <div className="sticky top-0 bg-dark-secondary border-b border-white/10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold">Create New User</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Username - same as before */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                Username *
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.username}
                onChange={handleUsernameChange}
                placeholder="johndoe"
                className={`w-full px-4 py-2 bg-white/5 rounded-lg border focus:outline-none text-white ${
                  usernameAvailable === true ? 'border-green-500' :
                  usernameAvailable === false ? 'border-red-500' :
                  'border-white/10 focus:border-primary/50'
                }`}
                required
                minLength="3"
                maxLength="20"
              />
              {checkingUsername && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {usernameAvailable === true && formData.username.length >= 3 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Check className="h-4 w-4 text-green-500" />
                </div>
              )}
              {usernameAvailable === false && formData.username.length >= 3 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </div>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2">
              {usernameAvailable === true && formData.username.length >= 3 && (
                <span className="text-xs text-green-500">Username is available</span>
              )}
              {usernameAvailable === false && formData.username.length >= 3 && (
                <span className="text-xs text-red-500">Username is already taken</span>
              )}
              {formData.username.length > 0 && formData.username.length < 3 && (
                <span className="text-xs text-yellow-500">Minimum 3 characters</span>
              )}
              <span className="text-xs text-gray-500 ml-auto">
                {formData.username.length}/20
              </span>
            </div>
          </div>

          {/* Display Name */}
          {/* <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                Display Name (Optional)
              </span>
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              placeholder="John Doe"
              className="w-full px-4 py-2 bg-white/5 rounded-lg border border-white/10 focus:border-primary/50 focus:outline-none text-white"
            />
          </div> */}

          {/* Password Options */}
          <div className="space-y-3 bg-white/5 rounded-xl p-4 border border-white/10">
            <h4 className="text-sm font-medium text-gray-400">Password Settings</h4>
            
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.autoGeneratePassword}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData(prev => ({ 
                      ...prev, 
                      autoGeneratePassword: checked,
                      password: checked ? '' : prev.password
                    }));
                  }}
                  className="h-4 w-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
                />
                Auto-generate password
              </label>
            </div>

            {!formData.autoGeneratePassword && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Custom Password
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter custom password"
                      className="w-full px-4 py-2 bg-white/5 rounded-lg border border-white/10 focus:border-primary/50 focus:outline-none text-white"
                      minLength="6"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyPassword}
                    className="p-2 text-gray-400 hover:text-primary transition"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {formData.autoGeneratePassword && (
              <>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-400">
                    Password Length:
                  </label>
                  <input
                    type="range"
                    min="6"
                    max="20"
                    value={formData.passwordLength}
                    onChange={(e) => setFormData({ ...formData, passwordLength: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <span className="text-sm text-primary font-medium min-w-[30px]">
                    {formData.passwordLength}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition"
                >
                  <RefreshCw className="h-4 w-4" />
                  Generate Password
                </button>

                {(formData.password || generatedPassword) && (
                  <div className="flex items-center gap-2 bg-white/5 rounded-lg p-2 border border-white/10">
                    <Key className="h-4 w-4 text-yellow-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password || generatedPassword}
                      readOnly
                      className="flex-1 bg-transparent text-yellow-400 font-mono text-sm focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-gray-400 hover:text-white transition"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="p-1 text-gray-400 hover:text-primary transition relative"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || usernameAvailable === false}
            className="w-full bg-primary text-black py-3 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Creating User...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Create User
              </>
            )}
          </button>

          <div className="text-xs text-gray-500 text-center space-y-1">
            <div>Username must be unique and at least 3 characters.</div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;