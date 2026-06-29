import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  LayoutDashboard,
  Train,
  Map,
  Shield,
  Binary,
  Wrench,
  AlertTriangle,
  Flame,
  FileSpreadsheet,
  BarChart3,
  LogOut,
  Sun,
  Moon,
  Compass,
  Cpu
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  // Filter links based on role authorization
  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Loco Engineer', 'Maintenance Technician', 'Inspector'] },
    { to: '/locomotives', label: 'Locomotive Fleet', icon: Train, roles: ['Admin', 'Maintenance Technician', 'Inspector'] },
    { to: '/rtis', label: 'RTIS Real-time Tracking', icon: Map, roles: ['Admin', 'Loco Engineer', 'Inspector'] },
    { to: '/kavach', label: 'Kavach Safety Control', icon: Shield, roles: ['Admin', 'Loco Engineer'] },
    { to: '/slam', label: 'SLAM Shed Mapping', icon: Compass, roles: ['Admin', 'Maintenance Technician'] },
    { to: '/maintenance', label: 'Maintenance Portal', icon: Wrench, roles: ['Admin', 'Maintenance Technician', 'Inspector'] },
    { to: '/incidents', label: 'Incident Desk', icon: AlertTriangle, roles: ['Admin', 'Loco Engineer', 'Inspector', 'Maintenance Technician'] },
    { restriction: 'none', to: '/predictive', label: 'Predictive Diagnostic', icon: Binary, roles: ['Admin', 'Maintenance Technician', 'Inspector'] },
    { to: '/fire-prevention', label: 'AI Fire Prevention', icon: Flame, roles: ['Admin', 'Loco Engineer', 'Maintenance Technician', 'Inspector'] },
    { to: '/health-intelligence', label: 'AI Health Intel', icon: Cpu, roles: ['Admin', 'Loco Engineer', 'Maintenance Technician', 'Inspector'] },
    { to: '/reports', label: 'System Reports', icon: FileSpreadsheet, roles: ['Admin', 'Inspector'] },
    { to: '/analytics', label: 'Failure Analytics', icon: BarChart3, roles: ['Admin', 'Inspector'] },
  ];

  const authorizedLinks = links.filter(link => link.roles.includes(user.role));

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${theme === 'dark'
          ? 'bg-slate-950/80 border-slate-800/60 text-slate-100'
          : 'bg-white/80 border-slate-200 text-slate-900'}
        backdrop-blur-md`}
    >
      {/* Sidebar Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-inherit">
        <div className="flex items-center space-x-3">
          <Shield className="h-7 w-7 text-railway-gold animate-pulse" />
          <span className="font-outfit text-xl font-bold tracking-tight bg-gradient-to-r from-white via-railway-gold to-railway-gold bg-clip-text text-transparent">
            RailSafe360
          </span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden p-1 rounded-md hover:bg-slate-800"
        >
          &times;
        </button>
      </div>

      {/* User Information */}
      <div className="px-6 py-4 border-b border-inherit bg-slate-900/10">
        <div className="text-sm font-semibold tracking-wide truncate">{user.name}</div>
        <div className="text-xs text-railway-gold/90 mt-0.5 tracking-wider font-mono">
          {user.role} | {user.employeeId}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto max-h-[calc(100vh-14rem)]">
        {authorizedLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `
                flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group
                ${isActive
                  ? 'bg-railway-blue text-white shadow-lg shadow-railway-blue/30 border border-railway-blue-light/20'
                  : 'hover:bg-slate-800/40 hover:text-railway-gold'}
              `}
            >
              <Icon className="mr-3 h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
              {link.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer Controls */}
      <div className="absolute bottom-0 w-full p-4 border-t border-inherit space-y-2">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium rounded-xl hover:bg-slate-800/40 transition-colors"
        >
          <span className="flex items-center">
            {theme === 'dark' ? <Sun className="mr-3 h-5 w-5 text-railway-gold" /> : <Moon className="mr-3 h-5 w-5 text-indigo-500" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>
        <button
          onClick={handleLogout}
          className="flex w-full items-center px-4 py-2.5 text-sm font-medium rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};
