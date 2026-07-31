import React from 'react';
import { 
  FileText, 
  Users, 
  HardDrive, 
  TrendingUp,
  BarChart3,
  Clock
} from 'lucide-react';

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
          {Object.entries(stats.fileTypes).map(([type, count]) => (
            <div key={type} className="bg-white/5 rounded-lg p-3">
              <p className="text-sm text-gray-400">{type || 'Unknown'}</p>
              <p className="text-xl font-bold">{count}</p>
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