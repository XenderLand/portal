import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  getAllUsers, 
  adminDeleteUser, 
  adminUpdateUser,
  getUserFiles,
  getUserStats
} from '../../services/adminFirebase';
import { toast } from 'react-toastify';
import { 
  Users, 
  Search, 
 
  Trash2, 

  Eye,
  Shield,
  ShieldOff,
  Mail,
  Calendar,
  FileText,
  HardDrive,

  X,
  
  RefreshCw,
  Download,
  UserCheck,

  Clock,
  UserPlus,

} from 'lucide-react';
import CreateUserModal from './CreateUserModal';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [editingUser, setEditingUser] = useState(null);
  const [userFiles, setUserFiles] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [showCreateModal, setShowCreateModal] = useState(false);
  // Load users
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await getAllUsers();
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      toast.error('Failed to load users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

   const handleUserCreated = (result) => {
    // Show the generated credentials to the admin
    toast.success(
      `User created: ${result.email} | Password: ${result.password}`,
      { autoClose: 10000 } // Keep visible longer so admin can copy
    );
    
    // Optionally show a modal with the credentials
    // setNewUserCredentials(result);
    // loadUsers(); // Refresh user list
  };


  // Filter and search users
  useEffect(() => {
    let filtered = users;

    // Search
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.uid?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'createdAt':
          return (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0);
        case 'email':
          return (a.email || '').localeCompare(b.email || '');
        case 'displayName':
          return (a.displayName || '').localeCompare(b.displayName || '');
        default:
          return 0;
      }
    });

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, sortBy]);

  const handleViewUser = async (userId) => {
    try {
      setLoading(true);
      const files = await getUserFiles(userId);
      const stats = await getUserStats(userId);
      setUserFiles(files);
      setUserStats(stats);
      setSelectedUser(users.find(u => u.uid === userId));
      setShowUserModal(true);
    } catch (error) {
      toast.error('Failed to load user details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Are you sure you want to delete ${userEmail || 'this user'}? This will delete all their files.`)) {
      return;
    }

    try {
      setLoading(true);
      await adminDeleteUser(userId);
      toast.success('User deleted successfully');
      loadUsers();
    } catch (error) {
      toast.error('Failed to delete user');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const action = newRole === 'admin' ? 'make an admin' : 'remove admin privileges';
    
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    try {
      setLoading(true);
      await adminUpdateUser(userId, { role: newRole });
      toast.success(`User ${newRole === 'admin' ? 'promoted to admin' : 'demoted from admin'}`);
      loadUsers();
    } catch (error) {
      toast.error('Failed to update user role');
      console.error(error);
    } finally {
      setLoading(false);
    }
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

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 mt-4">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">User Management</h2>
          <span className="text-sm text-gray-400">({filteredUsers.length} users)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadUsers}
            className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              // Export users as CSV
              const headers = ['UID', 'Email', 'Display Name', 'Role', 'Created At'];
              const rows = filteredUsers.map(user => [
                user.uid,
                user.email || '',
                user.displayName || '',
                user.role || 'user',
                formatDate(user.createdAt)
              ]);
              const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `users_${new Date().toISOString()}.csv`;
              a.click();
              window.URL.revokeObjectURL(url);
              toast.success('Users exported successfully');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg hover:bg-white/10 transition"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>
            <button
        onClick={() => setShowCreateModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-black rounded-lg font-semibold hover:bg-primary/90 transition"
      >
        <UserPlus className="h-4 w-4" />
        Create User
      </button>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUserCreated={handleUserCreated}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name, email, or UID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 rounded-lg border border-white/10 focus:border-primary/50 focus:outline-none text-white placeholder-gray-400"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 focus:border-primary/50 focus:outline-none text-white"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admins</option>
          <option value="user">Users</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 bg-white/5 rounded-lg border border-white/10 focus:border-primary/50 focus:outline-none text-white"
        >
          <option value="createdAt">Sort by: Newest</option>
          <option value="email">Sort by: Email</option>
          <option value="displayName">Sort by: Name</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/10 bg-white/5">
              <tr>
                <th className="p-4 text-left text-sm font-medium text-gray-400">User</th>
                <th className="p-4 text-left text-sm font-medium text-gray-400">Email</th>
                <th className="p-4 text-left text-sm font-medium text-gray-400">Role</th>
                <th className="p-4 text-left text-sm font-medium text-gray-400">Joined</th>
                <th className="p-4 text-center text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400">
                    <Users className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.uid} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full ${getRandomColor(user.uid)} flex items-center justify-center text-white font-medium`}>
                          {user.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName} className="h-10 w-10 rounded-full" />
                          ) : (
                            getInitials(user.displayName || user.email || 'U')
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{user.displayName || 'Unnamed User'}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[150px]">{user.uid}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span className="text-sm truncate max-w-[200px]">{user.email || 'No email'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-primary/20 text-primary' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {user.role === 'admin' ? (
                          <Shield className="h-3 w-3" />
                        ) : (
                          <UserCheck className="h-3 w-3" />
                        )}
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Calendar className="h-3 w-3" />
                        {formatDate(user.createdAt)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewUser(user.uid)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleToggleRole(user.uid, user.role)}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition"
                          title={user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                        >
                          {user.role === 'admin' ? (
                            <ShieldOff className="h-4 w-4" />
                          ) : (
                            <Shield className="h-4 w-4" />
                          )}
                        </button>

                        {user.uid !== currentUser?.uid && (
                          <button
                            onClick={() => handleDeleteUser(user.uid, user.email)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-secondary rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
            <div className="sticky top-0 bg-dark-secondary border-b border-white/10 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-full ${getRandomColor(selectedUser.uid)} flex items-center justify-center text-white font-bold text-lg`}>
                  {selectedUser.photoURL ? (
                    <img src={selectedUser.photoURL} alt={selectedUser.displayName} className="h-12 w-12 rounded-full" />
                  ) : (
                    getInitials(selectedUser.displayName || selectedUser.email || 'U')
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedUser.displayName || 'Unnamed User'}</h3>
                  <p className="text-sm text-gray-400">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-sm text-gray-400">User ID</p>
                  <p className="font-mono text-sm truncate">{selectedUser.uid}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Role</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    selectedUser.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {selectedUser.role === 'admin' ? <Shield className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                    {selectedUser.role || 'user'}
                  </span>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Joined</p>
                  <p>{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Last Updated</p>
                  <p>{formatDate(selectedUser.updatedAt)}</p>
                </div>
              </div>

              {/* Stats */}
              <div>
                <h4 className="font-semibold mb-3">Statistics</h4>
                {userStats ? (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-lg p-4 text-center">
                      <FileText className="h-5 w-5 text-primary mx-auto mb-2" />
                      <p className="text-2xl font-bold">{userStats.totalFiles || 0}</p>
                      <p className="text-sm text-gray-400">Total Files</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 text-center">
                      <HardDrive className="h-5 w-5 text-primary mx-auto mb-2" />
                      <p className="text-2xl font-bold">{formatSize(userStats.totalSize || 0)}</p>
                      <p className="text-sm text-gray-400">Storage Used</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4 text-center">
                      <Clock className="h-5 w-5 text-primary mx-auto mb-2" />
                      <p className="text-2xl font-bold">{userStats.totalUploads || 0}</p>
                      <p className="text-sm text-gray-400">Total Uploads</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No data available</p>
                )}
              </div>

              {/* User Files */}
              <div>
                <h4 className="font-semibold mb-3">User Files</h4>
                {userFiles.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {userFiles.map((file) => (
                      <div key={file.id} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                          <span className="text-xs text-gray-400">{formatSize(file.size)}</span>
                        </div>
                        <span className="text-xs text-gray-400">{formatDate(file.uploadedAt)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No files uploaded</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;