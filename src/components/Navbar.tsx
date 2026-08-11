import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Film, Menu, X, User as UserIcon, LogIn, LogOut, ShieldCheck, Lock, Check } from 'lucide-react';
import { useAuth } from '../auth';
import { Badge } from './Badge';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'guest' | 'admin'>('guest');

  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  const { user, isAuthenticated, isAdmin, loginAsGuest, loginAsAdmin, logout } = useAuth();

  const navItems = [
    { label: 'Overview', path: '/' },
    { label: 'Movies', path: '/movies' },
    { label: 'Showtimes', path: '/showtimes' },
    ...(isAdmin ? [{ label: 'Telemetry & Metrics', path: '/telemetry' }] : []),
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginAsGuest(guestEmail || undefined);
    setAuthModalOpen(false);
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    const success = await loginAsAdmin(adminUsername, adminPassword);
    if (success) {
      setAuthModalOpen(false);
    } else {
      setAdminError('Invalid admin username or password. (Use admin / admin)');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#090e0b]/80 backdrop-blur-md border-b border-emerald-950/50 shadow-xl">
        <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16">
          <div className="flex items-center justify-between h-16">
            {/* Green & White Brand Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-md bg-emerald-500 flex items-center justify-center text-black shadow-md shadow-emerald-950/60 group-hover:bg-emerald-400 transition-colors">
                <Film className="w-5 h-5 fill-black text-black" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-white leading-none font-sans">
                  MOVIE<span className="text-emerald-400">SEAT</span>
                </span>
                <span className="text-[9px] text-emerald-500/80 tracking-widest font-mono uppercase mt-0.5">
                  Official Ticketing
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-all ${
                      active
                        ? 'text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 shadow-sm font-semibold'
                        : 'text-neutral-300 hover:text-white hover:bg-emerald-950/30'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Header Controls (Auth) */}
            <div className="hidden sm:flex items-center gap-3">
              {isAuthenticated ? (
                <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-900/40 rounded-md p-1 pl-2.5 text-xs">
                  <span className="text-neutral-200 font-medium text-xs truncate max-w-[120px]">
                    {user?.name}
                  </span>
                  {isAdmin && (
                    <Badge variant="emerald" className="text-[10px] py-0 px-1.5 font-bold uppercase">
                      Admin
                    </Badge>
                  )}
                  <button
                    type="button"
                    onClick={logout}
                    className="p-1 text-neutral-400 hover:text-emerald-400 hover:bg-emerald-900/50 rounded transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-md shadow-emerald-950/40 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" /> Sign In
                </button>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-md text-neutral-300 hover:text-white hover:bg-emerald-950/40 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-emerald-950/60 bg-[#090e0b]/95 backdrop-blur-xl px-4 pt-2 pb-4 space-y-2">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 text-sm font-medium rounded-md ${
                    active
                      ? 'text-emerald-300 bg-emerald-950/80 border border-emerald-500/40'
                      : 'text-neutral-300 hover:text-white hover:bg-emerald-950/30'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="pt-2 border-t border-emerald-950/60 flex items-center justify-between text-xs text-neutral-400">
              {isAuthenticated ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-200 font-medium">{user?.name}</span>
                    {isAdmin && (
                      <Badge variant="emerald" className="text-[9px] py-0 px-1">
                        Admin
                      </Badge>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="px-2.5 py-1 text-emerald-400 bg-emerald-950/80 border border-emerald-800 rounded font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 bg-emerald-500 text-black font-bold rounded text-center"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Sign In Options Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <button
              type="button"
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-bold font-display text-white">Sign In to MovieSeat</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Choose your preferred sign in option below.
              </p>
            </div>

            {/* Auth Option Selector Tabs */}
            <div className="grid grid-cols-2 p-1 bg-neutral-950 border border-neutral-800 rounded-xl gap-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('guest');
                  setAdminError('');
                }}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  authMode === 'guest'
                    ? 'bg-emerald-500 text-black font-bold shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" /> Sign In as Guest
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('admin');
                  setAdminError('');
                }}
                className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  authMode === 'admin'
                    ? 'bg-emerald-500 text-black font-bold shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Sign In as Admin
              </button>
            </div>

            {/* Guest Form */}
            {authMode === 'guest' ? (
              <form onSubmit={handleGuestSubmit} className="space-y-4 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-300 uppercase tracking-wider mb-1.5">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="guest.viewer@cinemaseat.com"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg shadow-lg shadow-emerald-950/50 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <LogIn className="w-4 h-4" /> Continue as Guest
                </button>
              </form>
            ) : (
              /* Admin Form */
              <form onSubmit={handleAdminSubmit} className="space-y-4 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-300 uppercase tracking-wider mb-1.5">
                    Admin Username
                  </label>
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="admin"
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-300 uppercase tracking-wider mb-1.5">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••"
                    required
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {adminError && (
                  <p className="text-xs text-red-400 bg-red-950/50 border border-red-800/50 px-3 py-2 rounded-lg font-medium">
                    {adminError}
                  </p>
                )}

                <div className="p-2.5 bg-neutral-950/80 border border-neutral-800 rounded-lg text-[11px] text-neutral-400 space-y-0.5">
                  <span className="font-semibold text-emerald-400">Default Admin Credentials:</span>
                  <div>Username: <code className="text-white">admin</code> | Password: <code className="text-white">admin</code></div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg shadow-lg shadow-emerald-950/50 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <ShieldCheck className="w-4 h-4" /> Sign In as Admin
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
