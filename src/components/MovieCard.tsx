import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Film, Ticket, Star } from 'lucide-react';
import { Movie } from '../types/movie';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';
import { Button } from './Button';
import { Badge } from './Badge';
import { formatDuration } from '../utils/formatters';

interface MovieCardProps {
  movie: Movie;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const posterSrc =
    movie.posterUrl && movie.posterUrl.trim().length > 0
      ? movie.posterUrl.startsWith('http') || movie.posterUrl.startsWith('/')
        ? movie.posterUrl
        : `/${movie.posterUrl}`
      : '/images/brand_new_day.webp';

  return (
    <Card
      interactive
      className="flex flex-col h-full group overflow-hidden glass-card hover:border-emerald-500/60 hover:scale-[1.02] transition-all duration-300 ease-out shadow-xl"
    >
      {/* Movie Poster Cover Area */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-neutral-950/80 flex items-center justify-center">
        <img
          src={posterSrc}
          alt={`${movie.title} cover poster`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />

        {/* Subtle gradient overlay for contrast without darkening cover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

        {/* Age Rating Overlay (Rating badge removed per user request) */}
        <div className="absolute top-3 left-3 flex items-center justify-between gap-1.5 z-10">
          <Badge variant="primary" size="sm" className="bg-emerald-500 text-black border-emerald-400/40 shadow-md font-extrabold">
            {movie.ageRating}
          </Badge>
        </div>
      </div>

      {/* Card Content Header */}
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex flex-wrap gap-1 mb-1.5">
          {movie.genres.map((g) => (
            <span
              key={g}
              className="text-[10px] font-mono tracking-wider text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded font-medium"
            >
              {g}
            </span>
          ))}
        </div>

        <CardTitle className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1 font-sans">
          {movie.title}
        </CardTitle>
      </CardHeader>

      {/* Card Metadata */}
      <CardContent className="px-4 py-1 text-xs text-neutral-400 space-y-2">
        <div className="flex items-center gap-3 text-neutral-400 font-mono text-[11px]">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-emerald-500/70" />
            {formatDuration(movie.durationMinutes)}
          </span>
          <span className="text-emerald-900">•</span>
          <span className="truncate">
            Dir: <span className="text-neutral-200 font-medium">{movie.director}</span>
          </span>
        </div>
      </CardContent>

      {/* Primary Action Button */}
      <CardFooter className="px-4 pb-4 pt-3 border-t border-emerald-950/60 mt-auto">
        <Link to={`/movies/${movie.id}`} className="w-full">
          <Button
            variant="primary"
            size="lg"
            className="w-full justify-center bg-emerald-500 hover:bg-emerald-400 text-black font-black text-base py-3 shadow-[0_0_15px_rgba(16,185,129,0.7),0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,1),0_0_45px_rgba(16,185,129,0.5)] transition-all duration-300 transform hover:scale-[1.02]"
            icon={<Ticket className="w-4 h-4 text-black fill-black" />}
            iconPosition="left"
          >
            Get Tickets
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
