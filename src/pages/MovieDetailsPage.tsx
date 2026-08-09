import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Film, Calendar, Building2 } from 'lucide-react';
import { fetchMovieById } from '../api/movies';
import { fetchShowtimesByMovieId } from '../api/showtimes';
import { Showtime } from '../types/showtime';
import { useAsync } from '../hooks/useAsync';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { ShowtimeCard } from '../components/ShowtimeCard';
import { formatDuration } from '../utils/formatters';

export const MovieDetailsPage: React.FC = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const [selectedDate, setSelectedDate] = useState('2026-08-08');

  // Fetch Movie Details
  const {
    data: movie,
    loading: movieLoading,
    error: movieError,
    refetch: refetchMovie,
  } = useAsync(() => (movieId ? fetchMovieById(movieId) : Promise.resolve(null)), [movieId]);

  // Fetch Showtimes for Selected Movie & Date
  const {
    data: showtimes,
    loading: showtimesLoading,
    error: showtimesError,
    refetch: refetchShowtimes,
  } = useAsync<Showtime[]>(
    () => (movieId ? fetchShowtimesByMovieId(movieId, selectedDate) : Promise.resolve([])),
    [movieId, selectedDate]
  );

  const dates = [
    { label: 'Today, Aug 8', value: '2026-08-08' },
    { label: 'Tomorrow, Aug 9', value: '2026-08-09' },
    { label: 'Sunday, Aug 10', value: '2026-08-10' },
  ];

  // Group showtimes by Theatre / Hall
  const showtimesByTheatre = React.useMemo<Record<string, Showtime[]>>(() => {
    if (!showtimes) return {};
    return showtimes.reduce<Record<string, Showtime[]>>((acc, st) => {
      const hall = st.hallName || 'Main Theatre';
      if (!acc[hall]) {
        acc[hall] = [];
      }
      acc[hall].push(st);
      return acc;
    }, {});
  }, [showtimes]);

  if (movieLoading) {
    return <LoadingState message="Loading movie details and showtimes..." type="skeleton" />;
  }

  if (movieError) {
    return (
      <ErrorState
        title="Failed to load movie details"
        message={movieError.message}
        onRetry={refetchMovie}
      />
    );
  }

  if (!movie) {
    return (
      <EmptyState
        icon={<Film className="w-8 h-8 text-neutral-500" />}
        title="Movie Not Found"
        description="The requested movie listing could not be found or is no longer showing."
        actionLabel="Back to All Movies"
        onAction={() => window.history.back()}
      />
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Back Button */}
      <div>
        <Link to="/movies">
          <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
            Back to All Movies
          </Button>
        </Link>
      </div>

      {/* Movie Header Banner */}
      <div className="relative min-h-[260px] md:min-h-[320px] glass-container rounded-2xl overflow-hidden shadow-2xl flex items-end">
        {Boolean(movie.bannerUrl) && (
          <img
            src={movie.bannerUrl.startsWith('/') || movie.bannerUrl.startsWith('http') ? movie.bannerUrl : `/${movie.bannerUrl}`}
            alt={movie.title}
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-30 filter brightness-90"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070a09] via-[#070a09]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070a09] via-[#070a09]/80 to-transparent" />

        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6 w-full">
          {/* Movie Poster */}
          <div className="w-28 sm:w-36 aspect-[2/3] rounded-xl overflow-hidden bg-neutral-950/80 border border-emerald-900/50 shadow-2xl shrink-0">
            {Boolean(movie.posterUrl) ? (
              <img
                src={movie.posterUrl.startsWith('/') || movie.posterUrl.startsWith('http') ? movie.posterUrl : `/${movie.posterUrl}`}
                alt={movie.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : null}
          </div>

          {/* Compact Movie Info */}
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary" size="sm" className="bg-emerald-500 text-black font-extrabold">
                {movie.ageRating}
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight font-sans">
              {movie.title}
            </h1>

            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-neutral-300">
              <span className="font-semibold text-white">{formatDuration(movie.durationMinutes)}</span>
              <span className="text-emerald-900">•</span>
              <span className="text-neutral-300">{movie.genres.join(' / ')}</span>
            </div>

            {movie.tagline && (
              <p className="text-xs sm:text-sm font-medium italic text-neutral-400">
                "{movie.tagline}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Available Theatres & Showtimes Section */}
      <div className="space-y-6">
        {/* Date Selector Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-950/60">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2 font-sans">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Available Theatres & Showtimes
            </h2>
            <p className="text-xs text-neutral-300">
              Select a screening time to reserve seats
            </p>
          </div>

          {/* Date Picker Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-neutral-300 font-medium flex items-center gap-1 shrink-0 mr-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Date:
            </span>
            {dates.map((d) => (
              <button
                key={d.value}
                onClick={() => setSelectedDate(d.value)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer border whitespace-nowrap ${
                  selectedDate === d.value
                    ? 'bg-emerald-500 text-black border-emerald-400 font-extrabold shadow-md shadow-emerald-950/50'
                    : 'bg-emerald-950/40 text-neutral-300 border-emerald-900/50 hover:border-emerald-700 hover:bg-emerald-900/40'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {showtimesLoading && (
          <LoadingState message="Checking showtimes schedule across theatres..." />
        )}

        {/* Error State */}
        {showtimesError && (
          <ErrorState
            title="Failed to load showtimes"
            message={showtimesError.message}
            onRetry={refetchShowtimes}
          />
        )}

        {/* No Showtimes State */}
        {!showtimesLoading && !showtimesError && showtimes && showtimes.length === 0 && (
          <EmptyState
            icon={<Clock className="w-8 h-8 text-neutral-500" />}
            title="No Showtimes Scheduled"
            description="There are currently no active screenings for this movie on the selected date."
          />
        )}

        {/* Showtimes Organized by Theatre */}
        {!showtimesLoading && !showtimesError && showtimes && showtimes.length > 0 && (
          <div className="space-y-8">
            {(Object.entries(showtimesByTheatre) as [string, Showtime[]][]).map(([theatreName, theatreShowtimes]) => (
              <div key={theatreName} className="space-y-3">
                {/* Theatre Group Header */}
                <div className="flex items-center gap-2.5 text-sm font-bold text-white bg-neutral-900/60 border border-neutral-800/80 px-4 py-2.5 rounded-xl">
                  <Building2 className="w-4 h-4 text-red-500" />
                  <span>{theatreName}</span>
                  <span className="text-xs font-mono text-neutral-500 font-normal ml-auto">
                    {theatreShowtimes.length} screening{theatreShowtimes.length > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Showtime Cards Grid for this Theatre */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-0 sm:pl-2">
                  {theatreShowtimes.map((st) => (
                    <ShowtimeCard key={st.id} showtime={st} showTheatreName={false} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
