import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, X, Home, ClipboardCheck, UserPlus, UserCheck, Search, BarChart3, GraduationCap, User, Calendar, FileText, FolderOpen } from 'lucide-react';
import logo from 'figma:asset/c717e59cf8f32fe25477e30d5de63135f3057cc8.png';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showSidebar?: boolean;
}

export function Layout({ children, title, showSidebar = true }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleHome = () => {
    if (user?.role === 'Participant') {
      navigate('/participant-dashboard');
    } else {
      navigate('/dashboard');
    }
    setMobileMenuOpen(false);
  };

  const navigateTo = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const isActive = (path: string) => {
    // Handle query parameters for more accurate active state
    if (path.includes('?')) {
      return location.pathname + location.search === path;
    }
    return location.pathname === path;
  };
  const isDashboard = location.pathname === '/' || location.pathname === '/dashboard' || location.pathname === '/participant-dashboard';

  const staffMenuItems = [
    { path: 'home', icon: Home, label: 'Home', color: 'gray', action: 'home' },
    { path: '/attendance', icon: ClipboardCheck, label: 'Mark Attendance', color: 'blue' },
    { path: '/add-participant-multistep', icon: UserPlus, label: 'Register Participant', color: 'green', managerOnly: true },
    { path: '/add-to-program', icon: UserCheck, label: 'Add to Program', color: 'purple', managerOnly: true },
    { path: '/search', icon: Search, label: 'Find Participant', color: 'orange', adminOnly: true },
    { path: '/programs', icon: FolderOpen, label: 'View Programs', color: 'gray', adminOnly: true },
    { path: '/reports', icon: BarChart3, label: 'View Reports', color: 'teal', adminOnly: true },
    { path: '/training', icon: GraduationCap, label: 'Staff Training', color: 'indigo' },
  ];

  const participantMenuItems = [
    { path: 'home', icon: Home, label: 'Home', color: 'gray', action: 'home' },
    { path: '/participant/profile', icon: User, label: 'My Profile', color: 'blue' },
    { path: '/participant/events', icon: Calendar, label: 'Register for Events', color: 'green' },
    { path: '/participant/records', icon: FileText, label: 'My Records', color: 'purple' },
  ];

  // Filter menu items based on role
  const getFilteredMenuItems = () => {
    if (user?.role === 'Participant') {
      return participantMenuItems;
    }
    
    // For staff - only Mark Attendance and Staff Training
    if (user?.role === 'staff') {
      return staffMenuItems.filter(item => !item.managerOnly && !item.adminOnly);
    }
    
    // For manager - Staff + Register Participant + Add to Program
    if (user?.role === 'manager') {
      return staffMenuItems.filter(item => !item.adminOnly);
    }
    
    // For admin - full access
    return staffMenuItems;
  };

  const menuItems = getFilteredMenuItems();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 md:h-24">
            {/* Left Side - Logo and Title */}
            <div className="flex items-center gap-3 md:gap-4">
              <img 
                src={logo} 
                alt="The Hut Community Centre Logo" 
                className="h-12 md:h-16 w-auto"
              />
              <h1 className="text-base md:text-2xl lg:text-3xl font-bold text-white whitespace-nowrap hidden sm:block">
                The Hut Participation Portal
              </h1>
            </div>

            {/* Right Side - User Info & Logout */}
            <div className="flex items-center gap-3 md:gap-4">
              {user && (
                <div className="hidden lg:flex items-center gap-3 text-base text-white/90">
                  <span className="font-semibold">{user.name}</span>
                  <span className="text-white/60">|</span>
                  <span className="text-white/80">{user.role}</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-5 py-3 text-base font-semibold bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors shadow-md"
              >
                <LogOut size={20} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left Sidebar - Only show on non-dashboard pages */}
        {!isDashboard && showSidebar && (
          <>
            {/* Desktop Sidebar */}
            <aside className={`hidden lg:block bg-white shadow-lg transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-20'}`}>
              <div className="sticky top-0 h-screen overflow-y-auto">
                {/* Toggle Button */}
                <div className="p-4 border-b border-gray-200">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="w-full flex items-center justify-center p-3 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {sidebarOpen ? <X size={24} className="text-gray-700" /> : <Menu size={24} className="text-gray-700" />}
                  </button>
                </div>

                {/* Navigation Menu */}
                <nav className="p-4">
                  <div className="space-y-2">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      const handleClick = item.action === 'home' ? handleHome : () => navigateTo(item.path);
                      return (
                        <button
                          key={item.path}
                          onClick={handleClick}
                          className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all font-semibold text-left ${
                            active
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Icon size={24} className={sidebarOpen ? '' : 'mx-auto'} />
                          {sidebarOpen && <span className="text-base">{item.label}</span>}
                        </button>
                      );
                    })}
                  </div>
                </nav>
              </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
              <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setMobileMenuOpen(false)}>
                <div className="bg-white w-80 h-full shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Menu</h2>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-lg hover:bg-gray-100"
                    >
                      <X size={28} className="text-gray-700" />
                    </button>
                  </div>

                  {user && (
                    <div className="px-4 py-4 bg-blue-50 rounded-xl mb-6 border-2 border-blue-200">
                      <div className="font-bold text-gray-900">{user.name}</div>
                      <div className="text-gray-600">{user.role}</div>
                    </div>
                  )}

                  <nav className="space-y-3">
                    {menuItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      const handleClick = item.action === 'home' ? handleHome : () => navigateTo(item.path);
                      return (
                        <button
                          key={item.path}
                          onClick={handleClick}
                          className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all font-semibold text-left ${
                            active
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <Icon size={24} />
                          <span className="text-lg">{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-700 transition-colors z-40"
            >
              <Menu size={28} />
            </button>
          </>
        )}

        {/* Main Content */}
        <main className={`flex-1 ${!isDashboard && showSidebar ? 'lg:ml-0' : ''} max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full`}>
          {title && (
            <div className="mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">{title}</h2>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}