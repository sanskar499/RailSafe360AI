import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Shield, KeyRound, Mail, UserCheck, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await api.auth.login({ email, password });
      login(data);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectDemoAccount = (role: string) => {
    switch (role) {
      case 'Admin':
        setEmail('admin@railsafe.gov.in');
        setPassword('Password123');
        break;
      case 'Loco Engineer':
        setEmail('engineer@railsafe.gov.in');
        setPassword('Password123');
        break;
      case 'Maintenance Technician':
        setEmail('technician@railsafe.gov.in');
        setPassword('Password123');
        break;
      case 'Inspector':
        setEmail('inspector@railsafe.gov.in');
        setPassword('Password123');
        break;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden">
      {/* Background Graphic Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#072a43_1px,transparent_1px),linear-gradient(to_bottom,#072a43_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>

      <div className="w-full max-w-lg z-10 space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-railway-blue border border-railway-blue-light/40 shadow-lg shadow-railway-blue/50 mb-4">
            <Shield className="h-8 w-8 text-railway-gold animate-pulse" />
          </div>
          <h2 className="font-outfit text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-railway-gold bg-clip-text text-transparent">
            RailSafe360 Portal
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-xs">
            Intelligent Safety & Maintenance Management Core &bull; ELS Jamalpur
          </p>
        </div>

        <div className="glass-card rounded-3xl p-8 border border-slate-800/60 bg-slate-900/40">
          <h3 className="text-lg font-semibold mb-6">Portal Sign In</h3>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold leading-relaxed">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 tracking-wider uppercase">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@railsafe.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-railway-gold focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-400 tracking-wider uppercase">Secret Passcode</label>
                <Link to="/forgot-password" className="text-xs text-railway-gold hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-railway-gold focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-xl bg-railway-blue hover:bg-railway-blue-light text-white font-semibold text-sm shadow-lg shadow-railway-blue/30 border border-railway-blue-light/20 flex items-center justify-center transition-all duration-300"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Verifying Credentials...
                </>
              ) : (
                'Secure Sign In'
              )}
            </button>
          </form>

          {/* Quick Demo Login selector */}
          <div className="mt-8 border-t border-slate-800/80 pt-6">
            <div className="flex items-center space-x-2 mb-3">
              <UserCheck className="h-4 w-4 text-railway-gold" />
              <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                Demo Seeding Credentials Panel
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['Admin', 'Loco Engineer', 'Maintenance Technician', 'Inspector'].map((role) => (
                <button
                  key={role}
                  onClick={() => selectDemoAccount(role)}
                  className="text-left px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-850 hover:border-railway-gold/40 text-[11px] font-medium text-slate-300 transition-colors"
                >
                  <div className="font-semibold text-white">{role}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Password123</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">
          Not registered?{' '}
          <Link to="/register" className="text-railway-gold hover:underline font-semibold">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};
