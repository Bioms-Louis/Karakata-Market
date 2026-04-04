import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Tag, Package, Store, Users,
  ShoppingBag, Star, Bell, LogOut, Menu, X,
  ChevronLeft, ImagePlay
} from 'lucide-react';
import useAuthStore from '../store/authStore';

const DashboardLayout = ({ role }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const vendorLinks = [
    { to: '/vendor/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/vendor/products',  icon: <Package size={18} />,         label: 'Products' },
    { to: '/vendor/orders',    icon: <ShoppingBag size={18} />,     label: 'Orders' },
  ];

  const adminLinks = [
    { to: '/admin/dashboard',     icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/admin/carousel',       icon: <ImagePlay size={18} />,       label: 'Carousel' },
    { to: '/admin/products',      icon: <Package size={18} />,         label: 'Products' },
    { to: '/admin/categories',    icon: <Tag size={18} />,             label: 'Categories' },
    { to: '/admin/reviews',       icon: <Star size={18} />,            label: 'Reviews' },
    { to: '/admin/vendors',       icon: <Store size={18} />,           label: 'Vendors' },
    { to: '/admin/users',         icon: <Users size={18} />,           label: 'Users' },
    { to: '/admin/orders',        icon: <ShoppingBag size={18} />,     label: 'Orders' },
    { to: '/admin/notifications', icon: <Bell size={18} />,            label: 'Notifications' },
  ];

  const links = role === 'admin' ? adminLinks : vendorLinks;
  const title = role === 'admin' ? 'Admin Panel' : 'Vendor Panel';

  // Sidebar content
  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className={`flex items-center mb-8 ${
        collapsed ? 'justify-center' : 'justify-between'
      }`}>
        {!collapsed && (
          <h2 className="text-lg font-extrabold text-orange-400 truncate">
            {title}
          </h2>
        )}
        {/* Desktop collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center
                     w-8 h-8 rounded-lg bg-gray-800
                     hover:bg-gray-700 transition-colors shrink-0"
        >
          <ChevronLeft
            size={16}
            className={`text-gray-400 transition-transform duration-300 ${
              collapsed ? 'rotate-180' : ''
            }`}
          />
        </button>
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden flex items-center justify-center
                     w-8 h-8 rounded-lg bg-gray-800
                     hover:bg-gray-700 transition-colors"
        >
          <X size={16} className="text-gray-400" />
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={() => setMobileOpen(false)}
            title={collapsed ? link.label : ''}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl
               transition-all group relative ${
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <span className="shrink-0">{link.icon}</span>
                {!collapsed && (
                  <span className="text-sm font-medium truncate">
                    {link.label}
                  </span>
                )}
                {/* Tooltip when collapsed */}
                {collapsed && (
                  <span className="absolute left-full ml-3 px-2.5 py-1.5
                                   bg-gray-700 text-white text-xs font-medium
                                   rounded-lg whitespace-nowrap z-50
                                   opacity-0 group-hover:opacity-100
                                   pointer-events-none transition-opacity
                                   shadow-lg">
                    {link.label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        title={collapsed ? 'Logout' : ''}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl
                    text-gray-400 hover:bg-red-900/40 hover:text-red-400
                    transition-all mt-4 group relative w-full
                    ${collapsed ? 'justify-center' : ''}`}
      >
        <LogOut size={18} className="shrink-0" />
        {!collapsed && (
          <span className="text-sm font-medium">Logout</span>
        )}
        {collapsed && (
          <span className="absolute left-full ml-3 px-2.5 py-1.5
                           bg-gray-700 text-white text-xs font-medium
                           rounded-lg whitespace-nowrap z-50
                           opacity-0 group-hover:opacity-100
                           pointer-events-none transition-opacity
                           shadow-lg">
            Logout
          </span>
        )}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-gray-900 text-white
        p-5 z-50 flex flex-col transform transition-transform
        duration-300 ease-in-out lg:hidden
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className={`
        hidden lg:flex flex-col shrink-0 bg-gray-900 text-white p-5
        transition-all duration-300 ease-in-out sticky top-0 h-screen
        ${collapsed ? 'w-20' : 'w-64'}
      `}>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile Top Bar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3
                        bg-white border-b border-gray-200 sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl bg-gray-900 text-white
                       hover:bg-gray-800 transition-colors"
          >
            <Menu size={20} />
          </button>
          <h2 className="text-base font-bold text-orange-500">{title}</h2>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-5 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;