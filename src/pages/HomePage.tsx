import React from 'react';
import { Link } from 'react-router-dom';
import { Film, Zap, ShieldCheck, ArrowRight, Calendar, Ticket, Sparkles } from 'lucide-react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { SectionHeader } from '../components/SectionHeader';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { MovieCard } from '../components/MovieCard';
import { useAsync } from '../hooks/useAsync';
import { getMovies } from '../api/movies';

export const HomePage: React.FC = () => {
  const { data: movies, loading, error, refetch } = useAsync(() => getMovies(), []);

  const featuredBanner = movies && movies.length > 0 ? (movies.find((m) => m.isFeatured)?.bannerUrl || movies[0].bannerUrl) : null;

  return (
    <div className="space-y-12 pb-16">
      {/* Overview Hero Section */}
      <section className="relative rounded-2xl bg-neutral-950 border border-neutral-800 p-6 md:p-10 overflow-hidden shadow-2xl">
        {Boolean(featuredBanner && featuredBanner.trim().length > 0) && (
          <img
            src={featuredBanner!.startsWith('/') || featuredBanner!.startsWith('http') ? featuredBanner! : `/${featuredBanner}`}
            alt="Cinema Backdrop"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-30 filter brightness-90 pointer-events-none"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/90 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/60 text-red-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-red-500" />
            <span>Next-Generation Cinema Ticketing</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black font-display tracking-tight text-white leading-tight">
            Movie<span className="text-emerald-400">Seat</span> — Grab Your
            <br />
            <span className="text-emerald-400">Seat</span> Now
          </h1>

          <p className="text-base text-neutral-300 leading-relaxed max-w-2xl">
            Skip the hassle and book your movie tickets in just a few clicks. Choose your movie, pick your preferred seats, and secure your tickets instantly all from the comfort of your home.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link to="/movies">
              <Button
                variant="primary"
                size="lg"
                icon={<Ticket className="w-5 h-5 text-black fill-black" />}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-black text-lg px-7 py-3.5 shadow-[0_0_20px_rgba(16,185,129,0.75),0_0_40px_rgba(16,185,129,0.35)] hover:shadow-[0_0_30px_rgba(16,185,129,1),0_0_60px_rgba(16,185,129,0.6)] transition-all duration-300 transform hover:scale-105"
              >
                Book Tickets
              </Button>
            </Link>
            <Link to="/showtimes">
              <Button variant="secondary" size="md" icon={<Calendar className="w-4 h-4" />}>
                View Showtimes
              </Button>
            </Link>
          </div>
        </div>

        {/* System Highlights */}
        <div className="mt-8 pt-8 border-t border-neutral-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-neutral-400">
          <div className="space-y-1">
            <span className="text-neutral-500 block">Experience</span>
            <span className="text-neutral-200 font-semibold flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-red-500" /> IMAX & 3D Formats
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-neutral-500 block">Reservation</span>
            <span className="text-neutral-200 font-semibold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Instant 10-Min Seat Hold
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-neutral-500 block">Seat Maps</span>
            <span className="text-neutral-200 font-semibold flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5 text-emerald-500" /> Live Interactive Grid
            </span>
          </div>
          <div className="space-y-1">
            <span className="text-neutral-500 block">Security</span>
            <span className="text-neutral-200 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Instant QR Confirmation
            </span>
          </div>
        </div>
      </section>

      {/* Featured Movie Catalog */}
      <section className="space-y-6">
        <SectionHeader
          title="Featured Releases"
          subtitle="Showing active cinema releases ready for seat selection"
          badge={<Badge variant="primary">Now Showing</Badge>}
          action={
            <Link to="/movies">
              <Button variant="ghost" size="sm" icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
                View All Movies
              </Button>
            </Link>
          }
        />

        {loading && <LoadingState message="Loading movie catalog..." />}

        {error && (
          <ErrorState
            title="Failed to load movies"
            message={error.message}
            onRetry={refetch}
          />
        )}

        {!loading && !error && movies && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
