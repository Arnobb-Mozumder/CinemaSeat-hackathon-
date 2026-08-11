import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Film, Activity } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { AuthProvider, ProtectedRoute, AdminRoute, useAuth } from './auth';
import { MoviesPage } from './pages/MoviesPage';
import { MovieDetailsPage } from './pages/MovieDetailsPage';
import { ShowtimesPage } from './pages/ShowtimesPage';
import { SeatsPage } from './pages/SeatsPage';
import { PaymentPage } from './pages/PaymentPage';
import { BookingPage } from './pages/BookingPage';
import { TelemetryPage } from './pages/TelemetryPage';
import { NotFoundPage } from './pages/NotFoundPage';

const Footer: React.FC = () => {
  const { isAdmin } = useAuth();

  return (
    <footer className="border-t border-emerald-950/60 bg-emerald-950/20 backdrop-blur-lg py-8 text-xs text-neutral-400 mt-auto">
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center text-black text-xs font-bold shadow-md shadow-emerald-950/50">
            <Film className="w-3.5 h-3.5 fill-black text-black" />
          </div>
          <span className="font-extrabold text-white tracking-tight font-display">
            MOVIE<span className="text-emerald-400">SEAT</span>
          </span>
          <span className="text-emerald-900">•</span>
          <span className="font-mono text-[11px] text-neutral-400">Official Ticketing Platform</span>
        </div>

        <div className="flex items-center gap-6 text-neutral-300 font-medium">
          <Link to="/movies" className="hover:text-emerald-400 transition-colors">
            Movies
          </Link>
          <Link to="/showtimes" className="hover:text-emerald-400 transition-colors">
            Showtimes
          </Link>
          {isAdmin && (
            <Link
              to="/telemetry"
              className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-emerald-400 font-semibold"
            >
              <Activity className="w-3.5 h-3.5" /> Telemetry & Metrics
            </Link>
          )}
        </div>

        <div className="text-[11px] text-neutral-500">
          © {new Date().getFullYear()} MovieSeat. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-w-full min-h-screen bg-[#070a09]/80 backdrop-blur-xl text-white flex flex-col font-sans selection:bg-emerald-500 selection:text-black">
          {/* Global Navigation Header */}
          <Navbar />

          {/* Main Responsive Content Frame */}
          <main className="flex-1 w-full px-4 sm:px-8 lg:px-12 xl:px-16 pt-6 pb-12">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<MoviesPage />} />
              <Route path="/movies" element={<MoviesPage />} />
              <Route path="/movies/:movieId" element={<MovieDetailsPage />} />
              <Route path="/showtimes" element={<ShowtimesPage />} />
              <Route path="/shows/:showId/seats" element={<SeatsPage />} />

              {/* Admin-Only Route */}
              <Route
                path="/telemetry"
                element={
                  <AdminRoute>
                    <TelemetryPage />
                  </AdminRoute>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/payment/:bookingId"
                element={
                  <ProtectedRoute>
                    <PaymentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking/:bookingId"
                element={
                  <ProtectedRoute>
                    <BookingPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>

          {/* Shared Dark Glass Footer */}
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}
