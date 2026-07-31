import React, { useState, useEffect, useCallback } from 'react';
import { getAllUsers, getUserPassword } from '../../utils/credentialGenerator';
import { toast } from 'react-toastify';
import { Users, Search, Calendar, User, Mail, RefreshCw, Copy, Check, Key, Eye, EyeOff, Loader2 } from 'lucide-react';

const UsersTable = ({ refreshTrigger }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPasswords, setLoadingPasswords] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [passwords, setPasswords] = useState({});
  const [showPasswords, setShowPasswords] = useState({});

  // ✅ Define loadAllPasswords first with useCallback
  const loadAllPasswords = useCallback(async (usersList) => {
    const passwordMap = {};
    const loadingStates = {};
    
    // Set loading for all users
    usersList.forEach(user => {
      loadingStates[user.uid] = true;
    });
    setLoadingPasswords(loadingStates);
    
    // Load passwords one by one
    for (const user of usersList) {
      try {
        console.log(`🔍 Fetching password for ${user.username}...`);
        const pwd = await getUserPassword(user.uid);
        if (pwd) {
          passwordMap[user.uid] = pwd;
          console.log(`✅ Password found for ${user.username}`);
        } else {
          console.log(`⚠️ No password found for ${user.username}`);
        }
      } catch (error) {
        console.error(`❌ Error loading password for ${user.username}:`, error);
      } finally {
        loadingStates[user.uid] = false;
        setLoadingPasswords({ ...loadingStates });
      }
    }
    
    setPasswords(passwordMap);
  }, []); // ✅ Empty dependency array

  // ✅ loadUsers with loadAllPasswords as a dependency
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const usersData = await getAllUsers();
      console.log('📄 Users loaded:', usersData.length);
      setUsers(usersData);
      setFilteredUsers(usersData);
      
      // Load passwords for all users
      await loadAllPasswords(usersData); // ✅ Now loadAllPasswords is a dependency
      
    } catch (error) {
      toast.error('Failed to load users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [loadAllPasswords]); // ✅ Added loadAllPasswords as a dependency

  // ✅ useEffect with proper dependencies
  useEffect(() => {
    loadUsers();
  }, [refreshTrigger, loadUsers]); // ✅ Include both dependencies

  // ✅ Filter effect
  useEffect(() => {
    let filtered = users;
    if (searchTerm) {
      filtered = users.filter(user => 
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(Date.now());
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleShowPassword = (uid) => {
    setShowPasswords(prev => ({
      ...prev,
      [uid]: !prev[uid]
    }));
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRandomColor = (str) => {
    if (!str) return 'bg-gray-500';
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // ✅ Force reload passwords
  const reloadPasswords = useCallback(async () => {
    toast.info('Reloading passwords...');
    await loadAllPasswords(users);
    toast.success('Passwords reloaded!');
  }, [users, loadAllPasswords]); // ✅ Include dependencies

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by username, name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 rounded-lg border border-white/10 focus:border-primary/50 focus:outline-none text-white placeholder-gray-400"
          />
        </div>
        <button
          onClick={reloadPasswords}
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition"
        >
          <RefreshCw className="h-4 w-4" />
          Reload Passwords
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="p-4 text-left text-sm font-medium text-gray-400">User</th>
                <th className="p-4 text-left text-sm font-medium text-gray-400">Username</th>
                <th className="p-4 text-left text-sm font-medium text-gray-400">Password</th>
                <th className="p-4 text-left text-sm font-medium text-gray-400">Email</th>
                <th className="p-4 text-left text-sm font-medium text-gray-400">Created</th>
                <th className="p-4 text-center text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-3">
                      <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      Loading users...
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">
                    <Users className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isLoading = loadingPasswords[user.uid];
                  const password = passwords[user.uid];
                  const showPassword = showPasswords[user.uid];
                  
                  return (
                    <tr key={user.uid} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full ${getRandomColor(user.uid)} flex items-center justify-center text-white font-medium text-sm`}>
                            {getInitials(user.displayName || user.username || 'U')}
                          </div>
                          <div>
                            <p className="font-medium">{user.displayName || user.username || 'Unnamed'}</p>
                            <p className="text-xs text-gray-400">{user.role === 'admin' ? '👑 Admin' : '👤 User'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-primary">{user.username}</span>
                          <button
                            onClick={() => handleCopy(user.username)}
                            className="p-1 text-gray-400 hover:text-primary transition"
                          >
                            {copiedId === Date.now() ? (
                              <Check className="h-3 w-3 text-green-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Key className="h-3 w-3 text-yellow-400" />
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 text-primary animate-spin" />
                          ) : password ? (
                            <>
                              <span className="text-sm font-mono text-yellow-400">
                                {showPassword ? password : '••••••••'}
                              </span>
                              <button
                                onClick={() => toggleShowPassword(user.uid)}
                                className="p-1 text-gray-400 hover:text-white transition"
                              >
                                {showPassword ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </button>
                              <button
                                onClick={() => handleCopy(password)}
                                className="p-1 text-gray-400 hover:text-primary transition"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-500">No password stored</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="text-sm truncate max-w-[150px]">{user.email || 'No email'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="h-3 w-3" />
                          {formatDate(user.createdAt)}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              toast.info(
                                `👤 Username: ${user.username}\n🔑 Password: ${password || 'N/A'}\n📧 Email: ${user.email}\n🆔 UID: ${user.uid}`,
                                { autoClose: 10000 }
                              );
                            }}
                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition"
                            title="View Details"
                          >
                            <User className="h-4 w-4" />
                          </button>
                          {user.role !== 'admin' && password && (
                            <button
                              onClick={() => {
                                handleCopy(`Username: ${user.username}\nPassword: ${password}`);
                              }}
                              className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition"
                              title="Copy Credentials"
                            >
                              <Key className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UsersTable;