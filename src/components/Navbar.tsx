import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Film, Menu, X, Terminal, Server, User as UserIcon, LogIn, LogOut } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../auth';
import { Badge } from './Badge';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, login, logout } = useAuth();

  const navItems = [
    { label: 'Overview', path: '/' },
    { label: 'Movies', path: '/movies' },
    { label: 'Showtimes', path: '/showtimes' },
    { label: 'Telemetry & Metrics', path: '/telemetry' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
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
                onClick={() => login('guest.viewer@cinemaseat.com')}
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
                <span className="text-neutral-200 font-medium">{user?.name}</span>
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
                  login('guest.viewer@cinemaseat.com');
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
  );
};
