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
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [files, setFiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);

//   const isAdmin = user?.email === 'admin@example.com'; // Change this

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
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
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
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

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 mt-4">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark flex">
      {/* Sidebar */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-400 mt-1">Manage files, users, and monitor system activity</p>
          </div>

          {/* Content */}
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
      </div>
    </div>
  );
};

export default AdminDashboard;