import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Film, Search, Ticket, Info, Calendar, Clock } from 'lucide-react';
import { MovieCard } from '../components/MovieCard';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { useAsync } from '../hooks/useAsync';
import { fetchMovies } from '../api/movies';
import { formatDuration } from '../utils/formatters';

export const MoviesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: movies,
    loading,
    error,
    refetch,
  } = useAsync(
    () => fetchMovies({ search: searchQuery }),
    [searchQuery]
  );

  // Find a featured movie for the hero banner
  const featuredMovie = movies && movies.length > 0 ? (movies.find(m => m.isFeatured) || movies[0]) : null;

  return (
    <div className="space-y-10 pb-16">
      {/* Featured Glass Hero Banner */}
      {!loading && !error && featuredMovie && !searchQuery && (
        <div className="relative w-full rounded-2xl overflow-hidden glass-container shadow-2xl min-h-[380px] sm:min-h-[440px] flex items-end">
          {/* Banner Image Background */}
          {Boolean(featuredMovie.bannerUrl && featuredMovie.bannerUrl.trim().length > 0) ? (
            <img
              src={featuredMovie.bannerUrl.startsWith('/') || featuredMovie.bannerUrl.startsWith('http') ? featuredMovie.bannerUrl : `/${featuredMovie.bannerUrl}`}
              alt={featuredMovie.title}
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover object-center opacity-30 filter brightness-90"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/80 via-neutral-950 to-emerald-950/80 opacity-90" />
          )}

          {/* Vignette Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070a09] via-[#070a09]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070a09] via-[#070a09]/80 to-transparent" />

          {/* Hero Content Overlay */}
          <div className="relative z-10 p-6 sm:p-10 lg:p-14 max-w-4xl space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold tracking-widest text-emerald-400 uppercase bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-500/40 font-mono">
                Featured Spotlight
              </span>
              <Badge variant="primary" size="sm" className="bg-emerald-500 text-black font-extrabold">
                {featuredMovie.ageRating}
              </Badge>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-display text-white tracking-tight leading-tight drop-shadow-md">
              Movie<span className="text-emerald-400">Seat</span> — Grab Your
              <br />
              <span className="text-emerald-400">Seat</span> Now
            </h1>

            <p className="text-xs sm:text-sm lg:text-base text-neutral-300 line-clamp-3 leading-relaxed max-w-2xl font-sans">
              Skip the hassle and book your movie tickets in just a few clicks. Choose your movie, pick your preferred seats, and secure your tickets instantly all from the comfort of your home.
            </p>

            <div className="flex items-center gap-4 text-xs font-mono text-neutral-400 pt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-500/80" />
                {formatDuration(featuredMovie.durationMinutes)}
              </span>
              <span className="text-emerald-900">•</span>
              <span className="text-neutral-300 font-semibold">{featuredMovie.releaseYear}</span>
              <span className="text-emerald-900">•</span>
              <span className="truncate">{featuredMovie.genres.join(', ')}</span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-3">
              <Link to={`/movies/${featuredMovie.id}`}>
                <Button
                  variant="primary"
                  size="lg"
                  icon={<Ticket className="w-5 h-5 text-black fill-black" />}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-black text-lg px-7 py-3.5 shadow-[0_0_20px_rgba(16,185,129,0.75),0_0_40px_rgba(16,185,129,0.35)] hover:shadow-[0_0_30px_rgba(16,185,129,1),0_0_60px_rgba(16,185,129,0.6)] transition-all duration-300 transform hover:scale-105"
                >
                  Book Tickets
                </Button>
              </Link>
              <Link to={`/movies/${featuredMovie.id}`}>
                <Button
                  variant="secondary"
                  size="lg"
                  icon={<Info className="w-4 h-4" />}
                  className="bg-emerald-950/60 text-white border-emerald-800/80 hover:bg-emerald-900/60"
                >
                  More Info
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="glass-card p-4 rounded-xl flex items-center justify-between gap-4 shadow-xl">
        {/* Search Input */}
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search movie title, director or actor..."
            className="w-full bg-emerald-950/30 border border-emerald-900/50 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-colors font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-white cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-emerald-950/60 pb-3">
        <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2 font-sans">
          <span className="w-2 h-6 bg-emerald-500 rounded-full inline-block" />
          Trending Cinema Releases
        </h2>
        <span className="text-xs font-mono text-neutral-400">
          {movies ? `${movies.length} Title${movies.length === 1 ? '' : 's'}` : ''}
        </span>
      </div>

      {/* Async States: Loading / Error / Empty / Grid */}
      {loading && <LoadingState message="Fetching active cinema listings..." type="skeleton" />}

      {error && (
        <ErrorState
          title="Unable to load movies"
          message={error.message || 'Error communicating with movie server.'}
          onRetry={refetch}
        />
      )}

      {!loading && !error && movies && movies.length === 0 && (
        <EmptyState
          icon={<Film className="w-8 h-8 text-neutral-500" />}
          title="No movies found"
          description={`No current movies matched your search "${searchQuery}".`}
          actionLabel="Reset Search"
          onAction={() => {
            setSearchQuery('');
          }}
        />
      )}

      {!loading && !error && movies && movies.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
};
