import React from 'react';
import { 
  FileText, 
  Users, 
  HardDrive, 
  TrendingUp,
  BarChart3,
  Clock,

} from 'lucide-react';

  const DocumentPage = ({ label, bg, fold, text }) => (
  <svg viewBox="0 0 40 40" className="h-10 w-10 shrink-0" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 2h16l8 8v26a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"
      fill={bg}
    />
    <path d="M24 2v8h8z" fill={fold} />
    {label && (
      <text
        x="20"
        y="27"
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fontFamily="Arial, sans-serif"
        fill={text || '#fff'}
      >
        {label}
      </text>
    )}
  </svg>
);

const getFileTypeDisplay = (type = '', name = '') => {
  const ext = name?.split('.').pop()?.toLowerCase() || '';

  if (type?.startsWith('video/')) {
    return { label: '▶', bg: '#ec4899', fold: '#f472b6' };
  }
  if (type?.startsWith('audio/')) {
    return { label: '♪', bg: '#3b82f6', fold: '#60a5fa' };
  }
  if (type === 'application/pdf' || ext === 'pdf') {
    return { label: 'PDF', bg: '#dc2626', fold: '#f87171' };
  }
  if (['xls', 'xlsx', 'csv'].includes(ext) || type?.includes('spreadsheet') || type === 'text/csv') {
    return { label: 'XLS', bg: '#16a34a', fold: '#4ade80' };
  }
  if (['ppt', 'pptx'].includes(ext) || type?.includes('presentation')) {
    return { label: 'PPT', bg: '#d97706', fold: '#fbbf24' };
  }
  if (['doc', 'docx'].includes(ext) || type?.includes('wordprocessingml') || type === 'application/msword') {
    return { label: 'DOC', bg: '#2563eb', fold: '#60a5fa' };
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return { label: 'ZIP', bg: '#ca8a04', fold: '#fbbf24' };
  }
  if (['js', 'jsx', 'ts', 'tsx', 'json', 'html', 'css', 'py', 'java'].includes(ext)) {
    return { label: '</>', bg: '#0891b2', fold: '#22d3ee' };
  }
  if (['txt', 'rtf'].includes(ext) || type === 'text/plain') {
    return { label: 'TXT', bg: '#64748b', fold: '#94a3b8' };
  }
  return { label: ext ? ext.slice(0, 4).toUpperCase() : 'FILE', bg: '#4b5563', fold: '#9ca3af' };
};

const FileThumbnail = ({ name, type, url, size = ' h-14 w-14' }) => {
  if (type?.startsWith('image/') && url) {
    return (
      <img
        src={url}
        alt={name}
        className={`${size} rounded-lg object-cover border border-white/10 shrink-0`}
      />
    );
  }

  return <DocumentPage {...getFileTypeDisplay(type, name)} />;
};

const AdminStats = ({ stats }) => {
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const statsCards = [
    {
      title: 'Total Files',
      value: stats.totalFiles.toLocaleString(),
      icon: FileText,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/20'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
      border: 'border-green-400/20'
    },
    {
      title: 'Storage Used',
      value: formatBytes(stats.totalStorage),
      icon: HardDrive,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      border: 'border-purple-400/20'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers.toLocaleString(),
      icon: TrendingUp,
      color: 'text-primary',
      bg: 'bg-primary/10',
      border: 'border-primary/20'
    },
    {
      title: 'Avg File Size',
      value: formatBytes(stats.averageFileSize),
      icon: BarChart3,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
      border: 'border-yellow-400/20'
    },
    {
      title: 'File Types',
      value: Object.keys(stats.fileTypes).length,
      icon: Clock,
      color: 'text-pink-400',
      bg: 'bg-pink-400/10',
      border: 'border-pink-400/20'
    }
  ];


  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div 
              key={card.title}
              className={`bg-white/5 rounded-xl p-6 border ${card.border} hover:bg-white/10 transition`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${card.bg}`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* File Types Breakdown */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4">File Types Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats.fileTypes).map(([type, count, url, name]) => (
            <div key={type} className="flex justify-between bg-white/5 rounded-lg p-4  ">
            <FileThumbnail name={name} type={type} url={url} />
              {/* <p className="text-sm text-gray-400">{type || 'Unknown'}</p> */}
              <p className="text-2xl font-bold">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Activity */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold mb-4">Upload Activity (Last 30 Days)</h3>
        <div className="space-y-3">
          {Object.entries(stats.uploadsByMonth || {})
            .slice(-5)
            .reverse()
            .map(([month, count]) => (
              <div key={month} className="flex items-center gap-4">
                <span className="text-sm text-gray-400 w-20">{month}</span>
                <div className="flex-1 bg-white/10 rounded-full h-4 overflow-hidden">
                  <div 
                    className="bg-primary h-full rounded-full transition-all"
                    style={{ 
                      width: `${(count / Math.max(...Object.values(stats.uploadsByMonth))) * 100}%`,
                      minWidth: '10%'
                    }}
                  />
                </div>
                <span className="text-sm font-medium">{count} files</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default AdminStats;