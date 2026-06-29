import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Bell, Menu, User as UserIcon, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';

interface NavbarProps {
  onMenuToggle: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuToggle }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchAlerts = async () => {
    try {
      if (user) {
        const data = await api.locomotives.getAlerts();
        setAlerts(data.filter((a: any) => !a.resolved).slice(0, 5));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleResolveAlert = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.locomotives.resolveAlert(id);
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className={`sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b px-6 backdrop-blur-md transition-colors duration-300
      ${theme === 'dark'
        ? 'bg-slate-950/75 border-slate-800/60 text-slate-100'
        : 'bg-white/75 border-slate-200 text-slate-900'}`}
    >
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl hover:bg-slate-800/40"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="hidden sm:block">
          <span className="text-xs text-slate-400 font-mono">WORKSPACE</span>
          <h1 className="text-sm font-semibold tracking-wide font-outfit">
            ELS JAMALPUR &bull; EASTERN RAILWAY
          </h1>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative p-2 rounded-xl hover:bg-slate-800/40 transition-colors"
          >
            <Bell className="h-5 w-5" />
            {alerts.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-3 w-80 rounded-2xl bg-slate-950 border border-slate-800 p-2 shadow-2xl z-50">
              <div className="px-4 py-2 border-b border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 tracking-wider">ACTIVE SYSTEM ALERTS</span>
                <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">
                  {alerts.length} New
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto py-1">
                {alerts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    All safety metrics nominal. No active warnings.
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert._id}
                      className="px-4 py-3 border-b border-slate-800 last:border-b-0 hover:bg-slate-900/60 transition-colors flex flex-col space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-railway-gold font-mono">Loco #{alert.locoNo}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase
                          ${alert.priority === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {alert.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-snug">{alert.message}</p>
                      <div className="flex justify-between items-center pt-1 text-[10px] text-slate-500 font-mono">
                        <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                        {(user?.role === 'Admin' || user?.role === 'Inspector') && (
                          <button
                            onClick={(e) => handleResolveAlert(alert._id, e)}
                            className="text-railway-gold hover:text-white underline font-bold"
                          >
                            Resolve Alert
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Badge */}
        <div className="flex items-center space-x-3 border-l border-slate-800 pl-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-railway-blue border border-railway-blue-light/30">
            <UserIcon className="h-5 w-5 text-white" />
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold leading-none">{user?.name}</div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">{user?.employeeId}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
