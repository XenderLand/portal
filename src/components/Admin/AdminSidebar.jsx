import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
//   Settings,
  LogOut,
  Shield,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logOut } from '../../services/firebase';
import { toast } from 'react-toastify';

const AdminSidebar = ({ activeTab, setActiveTab, isMobileOpen, onMobileClose }) => {
  const navigate = useNavigate();

  const menuItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'files', icon: FileText, label: 'Files' },
    { id: 'users', icon: Users, label: 'Users' },
    // { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const handleLogout = async () => {
    try {
      await logOut();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const handleSelectTab = (id) => {
    setActiveTab(id);
    // On mobile the drawer should close after picking a tab; on desktop
    // onMobileClose is a no-op since the sidebar is always visible there.
    onMobileClose?.();
  };

  // Shared nav content, rendered once and reused by both the fixed desktop
  // sidebar and the mobile drawer so they never drift out of sync.
  const SidebarContent = ({ showCloseButton }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/10 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              Admin Panel
            </span>
          </div>
          <p className="text-xs text-primary mt-1">Adoo's Private Vault</p>
        </div>
        {showCloseButton && (
          <button
            onClick={onMobileClose}
            className="p-2 -mt-2 -mr-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                ${activeTab === item.id 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — unchanged behavior, always visible at lg+ */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-dark-secondary border-r border-white/10">
        <div className="mt-14 h-[calc(100%-3.5rem)]">
          <SidebarContent showCloseButton={false} />
        </div>
      </div>

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Mobile slide-in drawer */}
      <div
        className={`
          lg:hidden fixed inset-y-0 left-0 w-72 max-w-[80vw] bg-dark-secondary
          border-r border-white/10 z-50 transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <SidebarContent showCloseButton={true} />
      </div>
    </>
  );
};

export default AdminSidebar;
