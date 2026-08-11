import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { ShieldAlert, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '../components/Button';
import { LoadingState } from '../components/LoadingState';

export interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAdmin, isLoading, loginAsAdmin } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  if (isLoading) {
    return <LoadingState message="Verifying admin session..." type="spinner" />;
  }

  if (isAdmin) {
    return <>{children}</>;
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');

    const success = await loginAsAdmin(username, password);
    setIsLoggingIn(false);

    if (!success) {
      setError('Invalid admin credentials. (Use admin / admin)');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight font-display">Admin Authorization Required</h2>
          <p className="text-xs text-neutral-400 leading-relaxed max-w-sm mx-auto">
            The Telemetry & Metrics dashboard is restricted to system administrators. Please sign in as admin to access.
          </p>
        </div>

        <form onSubmit={handleAdminLogin} className="space-y-4 pt-2">
          <div>
            <label className="block text-[11px] font-medium text-neutral-300 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/50 border border-red-800/50 px-3 py-2 rounded-lg font-medium">
              {error}
            </p>
          )}

          <div className="p-2.5 bg-neutral-950/80 border border-neutral-800 rounded-lg text-[11px] text-neutral-400 space-y-0.5">
            <span className="font-semibold text-emerald-400">Default Credentials:</span>
            <div>Username: <code className="text-white">admin</code> | Password: <code className="text-white">admin</code></div>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoggingIn}
            className="flex items-center justify-center gap-2 py-2.5 font-bold bg-emerald-500 hover:bg-emerald-400 text-black"
          >
            <ShieldCheck className="w-4 h-4" /> Sign In as Admin
          </Button>
        </form>

        <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
          <Link
            to="/movies"
            className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Movies
          </Link>
          <span className="inline-flex items-center gap-1 text-[11px] text-neutral-500">
            Admin Restricted Area
          </span>
        </div>
      </div>
    </div>
  );
};
