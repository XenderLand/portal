import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../hooks/useAdmin';
import { Navigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminStats from './AdminStats';
import FileManagement from './FileManagement';
import UserManagement from './UserManagement';
import FileAnalytics from './FileAnalytics';
import { getFileAnalytics, getAllFiles, getAllUsers } from '../../services/adminFirebase';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [files, setFiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const { isAdmin: hookIsAdmin, loading:adminLoading, error } = useAdmin();

  const isAdmin = true;

  // Debug logs
  console.log('🔍 AdminDashboard: isAdmin =', isAdmin);
  console.log('🔍 AdminDashboard: adminLoading =', adminLoading);
  console.log('🔍 AdminDashboard: error =', error);
  console.log('🔍 AdminDashboard: user =', user);
  console.log('🔍 AdminDashboard: hookIsAdmin =', hookIsAdmin);
  useEffect(() => {
    console.log('🔍 AdminDashboard: useEffect triggered, isAdmin =', isAdmin);
    if (isAdmin) {
      console.log('✅ AdminDashboard: User is admin, loading data...');
      loadDashboardData();
    } else {
      console.log('❌ AdminDashboard: User is NOT admin');
    }
  }, [isAdmin]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('📊 AdminDashboard: Loading dashboard data...');
      const [analyticsData, filesData, usersData] = await Promise.all([
        getFileAnalytics(),
        getAllFiles(20),
        getAllUsers()
      ]);
      
      setStats(analyticsData);
      setFiles(filesData.files);
      setLastVisible(filesData.lastVisible);
      setHasMore(filesData.files.length === 20);
      setUsers(usersData);
      console.log('✅ AdminDashboard: Data loaded successfully');
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('❌ AdminDashboard: Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreFiles = async () => {
    try {
      const filesData = await getAllFiles(20, lastVisible);
      setFiles(prev => [...prev, ...filesData.files]);
      setLastVisible(filesData.lastVisible);
      setHasMore(filesData.files.length === 20);
    } catch (error) {
      toast.error('Failed to load more files');
      console.error(error);
    }
  };

  const handleFileDelete = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleFileUpdate = (updatedFile) => {
    setFiles(prev => prev.map(f => 
      f.id === updatedFile.id ? updatedFile : f
    ));
  };

  // Show loading state
  if (adminLoading) {
    console.log('⏳ AdminDashboard: Checking admin status...');
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 mt-4">Checking admin status...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    console.log('❌ AdminDashboard: Error:', error);
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/5 rounded-2xl p-8 border border-white/10 text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Admin</h2>
          <p className="text-gray-400 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-primary text-black rounded-lg font-semibold hover:bg-primary/90 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Check if not admin
  if (!isAdmin) {
    console.log('🚫 AdminDashboard: User is not admin, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // Admin dashboard content
  console.log('✅ AdminDashboard: Rendering admin dashboard');
  return (
    <div className="min-h-screen bg-dark flex">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 lg:ml-64">
        {loading && (
 <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Manage files, users, and monitor system activity</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                👑 Admin: {user?.displayName || user?.email}
              </span>
            </div>
          </div>

          {activeTab === 'overview' && stats && (
            <AdminStats stats={stats} />
          )}

          {activeTab === 'files' && (
            <FileManagement 
              files={files}
              onFileDelete={handleFileDelete}
              onFileUpdate={handleFileUpdate}
              loadMore={loadMoreFiles}
              hasMore={hasMore}
            />
          )}

          {activeTab === 'users' && (
            <UserManagement users={users} />
          )}

          {activeTab === 'analytics' && stats && (
            <FileAnalytics stats={stats} />
          )}
        </div>
        )}
       
      </div>
    </div>
  );
};


export default AdminDashboard;