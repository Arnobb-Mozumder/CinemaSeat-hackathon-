import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, Film, Monitor, Users } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { Card, CardContent } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { useAsync } from '../hooks/useAsync';
import { fetchShowtimes } from '../api/showtimes';
import { fetchMovies } from '../api/movies';
import { formatCurrency, formatTime } from '../utils/formatters';

export const ShowtimesPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState('2026-08-08');

  const {
    data: showtimes,
    loading: showtimesLoading,
    error: showtimesError,
    refetch: refetchShowtimes,
  } = useAsync(() => fetchShowtimes(undefined, selectedDate), [selectedDate]);

  const { data: movies } = useAsync(() => fetchMovies(), []);

  const getMovieById = (id: string) => movies?.find((m) => m.id === id);

  const dates = [
    { label: 'Today, Aug 8', value: '2026-08-08' },
    { label: 'Tomorrow, Aug 9', value: '2026-08-09' },
    { label: 'Sunday, Aug 10', value: '2026-08-10' },
  ];

  return (
    <div className="space-y-8 pb-16">
      <SectionHeader
        title="Screening Schedule & Showtimes"
        subtitle="Select a screening date and format to view seat map availability"
        badge={<Badge variant="gold">Real-time Seat Engine</Badge>}
      />

      {/* Date Picker Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-emerald-950/60">
        <span className="text-xs font-mono text-neutral-400 flex items-center gap-1.5 mr-2 shrink-0">
          <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" /> Date:
        </span>
        {dates.map((d) => (
          <button
            key={d.value}
            onClick={() => setSelectedDate(d.value)}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap border cursor-pointer ${
              selectedDate === d.value
                ? 'bg-emerald-500 text-black border-emerald-400 font-extrabold shadow-md shadow-emerald-950/50'
                : 'bg-emerald-950/40 text-neutral-300 border-emerald-900/50 hover:border-emerald-700 hover:bg-emerald-900/40'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {showtimesLoading && <LoadingState message="Loading showtimes schedule..." />}

      {showtimesError && (
        <ErrorState
          title="Failed to load schedule"
          message={showtimesError.message}
          onRetry={refetchShowtimes}
        />
      )}

      {!showtimesLoading && !showtimesError && showtimes && showtimes.length === 0 && (
        <EmptyState
          icon={<Clock className="w-8 h-8 text-neutral-500" />}
          title="No showtimes scheduled"
          description="There are no active screenings listed for the selected date."
        />
      )}

      {!showtimesLoading && !showtimesError && showtimes && showtimes.length > 0 && (
        <div className="space-y-4">
          {showtimes.map((st) => {
            const movie = getMovieById(st.movieId);
            const isLowAvailability = st.availableSeatsCount <= 10;

            return (
              <Card key={st.id} className="p-0 overflow-hidden glass-card hover:border-emerald-500/50 transition-all">
                <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Time Box */}
                    <div className="w-20 py-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex flex-col items-center justify-center shrink-0">
                      <span className="text-base font-bold text-emerald-400 font-mono">{formatTime(st.startTime)}</span>
                      <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-extrabold font-mono">
                        {st.format}
                      </span>
                    </div>

                    {/* Movie Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-bold text-white font-sans">{movie?.title || 'Cinema Feature'}</h4>
                        <Badge variant="neutral" size="sm" className="bg-emerald-950/60 text-emerald-300 border-emerald-800/60 font-sans">
                          {st.hallName}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-neutral-300 font-sans">
                        <span className="flex items-center gap-1">
                          <Monitor className="w-3.5 h-3.5 text-emerald-400" /> {st.format}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                          <span className={isLowAvailability ? 'text-amber-400 font-bold' : 'text-neutral-300 font-medium'}>
                            {st.availableSeatsCount} seats available
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & CTA */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-emerald-950/60">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-neutral-400 uppercase font-semibold block">Ticket Price</span>
                      <span className="text-base font-bold text-white font-sans">{formatCurrency(st.priceUSD)}</span>
                    </div>

                    <Link to={`/shows/${st.id}/seats`}>
                      <Button
                        variant="primary"
                        size="sm"
                        className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold shadow-md shadow-emerald-950/50"
                        icon={<Film className="w-3.5 h-3.5 text-black fill-black" />}
                      >
                        Select Seats
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
