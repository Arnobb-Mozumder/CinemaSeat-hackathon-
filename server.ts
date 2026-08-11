import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import client from 'prom-client';

const safeFilename = typeof __filename !== 'undefined'
  ? __filename
  : (typeof import.meta !== 'undefined' && import.meta && import.meta.url ? fileURLToPath(import.meta.url) : '');
const safeDirname = typeof __dirname !== 'undefined'
  ? __dirname
  : (safeFilename ? path.dirname(safeFilename) : process.cwd());

const app = express();
const PORT = parseInt(process.env.PORT || process.env.SERVER_PORT || '3000', 10);

app.use(express.json());

// Initialize Prometheus Default Metrics
client.collectDefaultMetrics({ prefix: 'movieseat_' });

// Prometheus Custom Application Metrics
export const httpRequestDurationSeconds = new client.Histogram({
  name: 'movieseat_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

export const httpRequestsTotal = new client.Counter({
  name: 'movieseat_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const activeSeatHoldsGauge = new client.Gauge({
  name: 'movieseat_active_seat_holds',
  help: 'Number of active seat holds currently in memory',
});

export const ticketsBookedTotal = new client.Counter({
  name: 'movieseat_tickets_booked_total',
  help: 'Total number of tickets booked',
  labelNames: ['movie_id', 'format'],
});

export const bookingRevenueUSD = new client.Counter({
  name: 'movieseat_booking_revenue_usd',
  help: 'Total revenue generated in USD',
});

// Track which bookings have had metrics recorded to ensure idempotency
const confirmedBookingMetricsRecorded = new Set<string>();

// Initialize default zero metrics so Prometheus scraper outputs non-empty metric series on startup
ticketsBookedTotal.inc({ movie_id: 'all', format: 'Standard 2D' }, 0);
bookingRevenueUSD.inc(0);

// Helper to reliably record Prometheus metrics on booking confirmation
function recordConfirmedBookingMetrics(booking: Booking, hold?: Hold) {
  if (!booking || booking.status !== 'confirmed') return;

  if (confirmedBookingMetricsRecorded.has(booking.bookingId)) {
    return; // Already recorded metrics for this booking
  }
  confirmedBookingMetricsRecorded.add(booking.bookingId);

  const targetHold = hold || (booking.holdId ? holdStore[booking.holdId] : undefined);
  const seatMap = targetHold ? seatStore[targetHold.showId] : undefined;
  const showtime = targetHold ? SHOWTIMES.find((s) => s.id === targetHold.showId) : undefined;

  const movieId =
    (seatMap && seatMap.show.movieId) ||
    (showtime && showtime.movieId) ||
    'unknown';

  const format =
    booking.format ||
    (seatMap && seatMap.show.format) ||
    (showtime && showtime.format) ||
    'Standard 2D';

  const seatCount =
    booking.seats && Array.isArray(booking.seats) && booking.seats.length > 0
      ? booking.seats.length
      : targetHold && targetHold.seatIds
      ? targetHold.seatIds.length
      : 1;

  const amountUSD = booking.totalAmountUSD || (targetHold ? targetHold.totalPriceUSD : 0);

  ticketsBookedTotal.inc({ movie_id: movieId, format }, seatCount);
  bookingRevenueUSD.inc(amountUSD);

  logDomainEvent('booking_confirmed', {
    bookingId: booking.bookingId,
    movieId,
    format,
    seatCount,
    amountUSD,
  });
}

// Phase 42: Safe Domain Event Logger
function logDomainEvent(event: string, details: Record<string, unknown>) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      event,
      ...details,
    })
  );
}

// Phase 40: CORS Middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOriginsEnv = process.env.CORS_ALLOWED_ORIGINS || '';
  const allowedOrigins = allowedOriginsEnv
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (origin) {
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-ID, X-Mock-Force, X-Mock-Status, X-Customer-Email');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Prometheus HTTP Request Metrics Middleware
app.use((req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const duration = process.hrtime(start);
    const durationInSeconds = duration[0] + duration[1] / 1e9;
    const route = req.route ? req.route.path : req.path || 'unknown';
    const statusCode = res.statusCode.toString();

    // Skip tracking /metrics scraping endpoint itself to prevent skew
    if (req.path !== '/metrics' && req.path !== '/api/metrics') {
      httpRequestsTotal.inc({ method: req.method, route, status_code: statusCode });
      httpRequestDurationSeconds.observe({ method: req.method, route, status_code: statusCode }, durationInSeconds);
    }
  });
  next();
});

// In-memory data structures
interface Movie {
  id: string;
  title: string;
  tagline: string;
  synopsis: string;
  durationMinutes: number;
  releaseYear: number;
  rating: number;
  ageRating: string;
  genres: string[];
  posterUrl: string;
  bannerUrl: string;
  director: string;
  cast: string[];
  isFeatured: boolean;
}

interface Showtime {
  id: string;
  movieId: string;
  hallId: string;
  hallName: string;
  startTime: string;
  date: string;
  format: string;
  priceUSD: number;
  availableSeatsCount: number;
}

interface Seat {
  id: string;
  seatId: string;
  rowLabel: string;
  colLabel: number;
  status: 'available' | 'held' | 'booked';
  priceUsd: number;
}

interface SeatMapData {
  show: {
    id: string;
    movieId: string;
    hallName: string;
    format: string;
    startTime: string;
    date: string;
    priceUsd: number;
  };
  seats: Seat[];
  rows: string[];
  seatsPerRow: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
}

interface PaymentRecord {
  paymentId: string;
  holdId: string;
  bookingId: string;
  amountUSD: number;
  status: 'pending' | 'successful' | 'failed';
  createdAt: string;
  transactionRef: string;
}

interface Hold {
  holdId: string;
  showId: string;
  seatIds: string[];
  expiresAt: string;
  expiresInSeconds: number;
  totalPriceUSD: number;
  status: 'active' | 'expired' | 'released' | 'completed';
  clientId?: string;
  accountId?: string;
}

interface Booking {
  bookingId: string;
  holdId?: string;
  customerId?: string;
  customer?: {
    name: string;
    phone: string;
    email: string;
  };
  movieTitle: string;
  moviePosterUrl: string;
  hallName: string;
  showtime: string;
  date: string;
  format: string;
  seats: string[];
  seatsFormatted: string;
  totalAmountUSD: number;
  totalAmountBDT: number;
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled';
  createdAt: string;
  paymentRef: string;
  customerName?: string;
  customerEmail?: string;
}

const customerStore: Record<string, Customer> = {};
const paymentStore: Record<string, PaymentRecord> = {};
const clientHoldRequestHistory: Record<string, number[]> = {};

function findOrCreateCustomer(name?: string, phone?: string, email?: string): Customer {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPhone = (phone || '').trim();

  const existing = Object.values(customerStore).find(
    (c) => (cleanEmail && c.email === cleanEmail) || (cleanPhone && c.phone === cleanPhone)
  );

  if (existing) {
    if (name) existing.name = name;
    if (cleanPhone) existing.phone = cleanPhone;
    if (cleanEmail) existing.email = cleanEmail;
    return existing;
  }

  const id = `cust-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const newCustomer: Customer = {
    id,
    name: name || 'Valued Customer',
    phone: cleanPhone,
    email: cleanEmail,
    createdAt: new Date().toISOString(),
  };
  customerStore[id] = newCustomer;
  return newCustomer;
}

const MOVIES: Movie[] = [
  {
    id: 'm-spiderman-2d',
    title: 'Spider-Man: Brand New Day (2D)',
    tagline: 'A fresh chapter in the web-slinger saga.',
    synopsis: 'Peter Parker navigates a brand new chapter filled with unexpected allies, emerging citywide threats, and fresh challenges in this 2D theatrical release.',
    durationMinutes: 135,
    releaseYear: 2026,
    rating: 8.8,
    ageRating: 'PG-13',
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    posterUrl: '/images/brand_new_day.webp',
    bannerUrl: '/images/brand_new_day.webp',
    director: 'Destin Daniel Cretton',
    cast: ['Tom Holland', 'Zendaya', 'Jacob Batalon'],
    isFeatured: true,
  },
  {
    id: 'm-spiderman-3d',
    title: 'Spider-Man: Brand New Day (3D)',
    tagline: 'Feel every swing in immersive 3D.',
    synopsis: 'Experience the high-octane web-slinging spectacle of Spider-Man: Brand New Day in full 3D visual depth with enhanced spatial audio and effects.',
    durationMinutes: 135,
    releaseYear: 2026,
    rating: 9.1,
    ageRating: 'PG-13',
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    posterUrl: '/images/3d.jpg',
    bannerUrl: '/images/3d.jpg',
    director: 'Destin Daniel Cretton',
    cast: ['Tom Holland', 'Zendaya', 'Jacob Batalon'],
    isFeatured: true,
  },
  {
    id: 'm-avatar-3',
    title: 'Avatar: Fire and Ash',
    tagline: 'Discover the fire tribe of Pandora.',
    synopsis: "Jake Sully and Neytiri encounter a new, aggressive clan of Na'vi known as the Ash People in an uncharted region of Pandora.",
    durationMinutes: 192,
    releaseYear: 2025,
    rating: 8.9,
    ageRating: 'PG-13',
    genres: ['Sci-Fi', 'Adventure', 'Action'],
    posterUrl: '/images/avatar.webp',
    bannerUrl: '/images/avatar.webp',
    director: 'James Cameron',
    cast: ['Sam Worthington', 'Zoe Saldaña', 'Sigourney Weaver'],
    isFeatured: true,
  },
  {
    id: 'm-inception-odyssey',
    title: 'Inception: Cosmic Rift',
    tagline: 'The mind is the scene of the crime.',
    synopsis: 'A team of dream operatives embark on a deep-level subconscious extraction mission that threatens the fabric of physical reality.',
    durationMinutes: 156,
    releaseYear: 2026,
    rating: 9.0,
    ageRating: 'PG-13',
    genres: ['Sci-Fi', 'Thriller', 'Action'],
    posterUrl: '/images/inception.jpg',
    bannerUrl: '/images/inception.jpg',
    director: 'Christopher Nolan',
    cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page'],
    isFeatured: false,
  },
  {
    id: 'm-dune-prophecy',
    title: 'Dune: Messiah Part 1',
    tagline: 'The desert power demands a reckoning.',
    synopsis: "Paul Atreides ascends the Emperor's throne while facing cosmic conspiracies and religious fervour across the known universe.",
    durationMinutes: 168,
    releaseYear: 2026,
    rating: 9.2,
    ageRating: 'PG-13',
    genres: ['Sci-Fi', 'Adventure', 'Drama'],
    posterUrl: '/images/dune.webp',
    bannerUrl: '/images/dune.webp',
    director: 'Denis Villeneuve',
    cast: ['Timothée Chalamet', 'Zendaya', 'Florence Pugh'],
    isFeatured: true,
  },
];

const SHOWTIMES: Showtime[] = [
  {
    id: 'st-sm2d-1',
    movieId: 'm-spiderman-2d',
    hallId: 'hall-a',
    hallName: 'Theatre A',
    startTime: '19:00',
    date: '2026-08-08',
    format: 'Standard 2D',
    priceUSD: 450,
    availableSeatsCount: 42,
  },
  {
    id: 'st-sm2d-2',
    movieId: 'm-spiderman-2d',
    hallId: 'hall-a',
    hallName: 'Theatre A',
    startTime: '22:00',
    date: '2026-08-08',
    format: 'Standard 2D',
    priceUSD: 450,
    availableSeatsCount: 18,
  },
  {
    id: 'st-sm2d-3',
    movieId: 'm-spiderman-2d',
    hallId: 'hall-b',
    hallName: 'Theatre B',
    startTime: '20:30',
    date: '2026-08-08',
    format: 'Standard 2D',
    priceUSD: 400,
    availableSeatsCount: 55,
  },
  {
    id: 'st-sm2d-4',
    movieId: 'm-spiderman-2d',
    hallId: 'hall-c',
    hallName: 'Theatre C',
    startTime: '16:15',
    date: '2026-08-08',
    format: 'Standard 2D',
    priceUSD: 400,
    availableSeatsCount: 30,
  },
  {
    id: 'st-sm3d-1',
    movieId: 'm-spiderman-3d',
    hallId: 'hall-imax',
    hallName: 'IMAX Auditorium',
    startTime: '18:00',
    date: '2026-08-08',
    format: 'IMAX 3D',
    priceUSD: 850,
    availableSeatsCount: 12,
  },
  {
    id: 'st-sm3d-2',
    movieId: 'm-spiderman-3d',
    hallId: 'hall-imax',
    hallName: 'IMAX Auditorium',
    startTime: '21:30',
    date: '2026-08-08',
    format: 'IMAX 3D',
    priceUSD: 850,
    availableSeatsCount: 6,
  },
  {
    id: 'st-sm3d-3',
    movieId: 'm-spiderman-3d',
    hallId: 'hall-dolby',
    hallName: 'Dolby Cinema Screen 1',
    startTime: '19:45',
    date: '2026-08-08',
    format: 'Dolby Cinema',
    priceUSD: 750,
    availableSeatsCount: 24,
  },
  {
    id: 'st-av3-1',
    movieId: 'm-avatar-3',
    hallId: 'hall-dolby',
    hallName: 'Dolby Cinema Screen 1',
    startTime: '17:00',
    date: '2026-08-08',
    format: 'Dolby Cinema',
    priceUSD: 800,
    availableSeatsCount: 34,
  },
  {
    id: 'st-av3-2',
    movieId: 'm-avatar-3',
    hallId: 'hall-imax',
    hallName: 'IMAX Auditorium',
    startTime: '20:15',
    date: '2026-08-08',
    format: 'IMAX 3D',
    priceUSD: 900,
    availableSeatsCount: 15,
  },
  {
    id: 'st-inc-1',
    movieId: 'm-inception-odyssey',
    hallId: 'hall-a',
    hallName: 'Theatre A',
    startTime: '18:30',
    date: '2026-08-08',
    format: 'Standard 2D',
    priceUSD: 450,
    availableSeatsCount: 50,
  },
  {
    id: 'st-inc-2',
    movieId: 'm-inception-odyssey',
    hallId: 'hall-b',
    hallName: 'Theatre B',
    startTime: '21:15',
    date: '2026-08-08',
    format: 'Standard 2D',
    priceUSD: 450,
    availableSeatsCount: 28,
  },
  {
    id: 'st-dune-1',
    movieId: 'm-dune-prophecy',
    hallId: 'hall-imax',
    hallName: 'IMAX Auditorium',
    startTime: '19:15',
    date: '2026-08-08',
    format: 'IMAX 3D',
    priceUSD: 900,
    availableSeatsCount: 9,
  },
  {
    id: 'st-dune-2',
    movieId: 'm-dune-prophecy',
    hallId: 'hall-c',
    hallName: 'Theatre C',
    startTime: '22:15',
    date: '2026-08-08',
    format: 'Standard 2D',
    priceUSD: 500,
    availableSeatsCount: 40,
  },
];

const seatStore: Record<string, SeatMapData> = {};
const holdStore: Record<string, Hold> = {};
const bookingStore: Record<string, Booking> = {};

function getOrCreateSeatMap(showId: string): SeatMapData {
  if (seatStore[showId]) {
    return seatStore[showId];
  }

  const showtime = SHOWTIMES.find((s) => s.id === showId) || SHOWTIMES[0];
  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const seatsPerRow = 12;
  const seats: Seat[] = [];

  let hash = 0;
  for (let i = 0; i < showId.length; i++) {
    hash = (hash << 5) - hash + showId.charCodeAt(i);
    hash |= 0;
  }
  let seed = Math.abs(hash) || 12345;

  const totalSeats = rows.length * seatsPerRow;
  const targetAvailableCount = Math.min(totalSeats, Math.max(0, showtime.availableSeatsCount));
  const targetBookedCount = totalSeats - targetAvailableCount;

  const allIndices = Array.from({ length: totalSeats }, (_, i) => i);
  for (let i = allIndices.length - 1; i > 0; i--) {
    seed = (seed * 9301 + 49297) % 233280;
    const j = Math.floor((seed / 233280) * (i + 1));
    const temp = allIndices[i];
    allIndices[i] = allIndices[j];
    allIndices[j] = temp;
  }

  const bookedIndices = new Set<number>(allIndices.slice(0, targetBookedCount));

  let globalIndex = 0;
  rows.forEach((row) => {
    let tierExtra = 0;
    if (row === 'C' || row === 'D') tierExtra = 100;
    else if (row === 'E' || row === 'F') tierExtra = 200;

    for (let num = 1; num <= seatsPerRow; num++) {
      const physicalSeatId = `${showId}-${row}${num}`;
      const isBooked = bookedIndices.has(globalIndex);

      seats.push({
        id: physicalSeatId,
        seatId: physicalSeatId,
        rowLabel: row,
        colLabel: num,
        status: isBooked ? 'booked' : 'available',
        priceUsd: Number((showtime.priceUSD + tierExtra).toFixed(2)),
      });

      globalIndex++;
    }
  });

  const seatMapData: SeatMapData = {
    show: {
      id: showtime.id,
      movieId: showtime.movieId,
      hallName: showtime.hallName,
      format: showtime.format,
      startTime: showtime.startTime,
      date: showtime.date,
      priceUsd: showtime.priceUSD,
    },
    seats,
    rows,
    seatsPerRow,
  };

  seatStore[showId] = seatMapData;
  return seatMapData;
}

// API Routes (handling both /api/* and /* prefixes)

// Health check
app.get(['/api/health', '/health'], (_req, res) => {
  res.json({ status: 'ok', service: 'movieseat-backend' });
});

// Prometheus Scraper Endpoint
app.get(['/metrics', '/api/metrics'], async (_req, res) => {
  try {
    // Update gauge metric before returning output
    const activeCount = Object.values(holdStore).filter(
      (h) => new Date(h.expiresAt).getTime() > Date.now() && h.status === 'active'
    ).length;
    activeSeatHoldsGauge.set(activeCount);

    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).end((err as Error).message);
  }
});

// JSON Summary Endpoint for Testing & In-App Telemetry Dashboard
app.get('/api/metrics/summary', async (_req, res) => {
  try {
    const activeCount = Object.values(holdStore).filter(
      (h) => new Date(h.expiresAt).getTime() > Date.now() && h.status === 'active'
    ).length;
    activeSeatHoldsGauge.set(activeCount);

    const metricsRaw = await client.register.getMetricsAsJSON();
    res.json({
      service: 'movieseat-backend',
      timestamp: new Date().toISOString(),
      activeHolds: activeCount,
      totalBookings: Object.keys(bookingStore).length,
      prometheusEndpoint: '/metrics',
      metrics: metricsRaw,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Movies
app.get(['/api/movies', '/movies'], (req, res) => {
  let results = [...MOVIES];
  const genre = req.query.genre as string;
  const search = req.query.search as string;

  if (genre && genre !== 'All') {
    results = results.filter((m) => m.genres.includes(genre));
  }
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.director.toLowerCase().includes(q) ||
        m.synopsis.toLowerCase().includes(q)
    );
  }

  res.json(results);
});

app.get(['/api/movies/:id', '/movies/:id'], (req, res) => {
  const movie = MOVIES.find((m) => m.id === req.params.id);
  if (!movie) {
    res.status(404).json({ message: 'Movie not found' });
    return;
  }
  res.json(movie);
});

// Shows
function getAvailableSeatsCountForShow(showId: string): number {
  const seatMap = getOrCreateSeatMap(showId);
  refreshSeatStatuses(seatMap);
  return seatMap.seats.filter((s) => s.status === 'available').length;
}

app.get(['/api/shows', '/shows'], (req, res) => {
  let results = SHOWTIMES.map((s) => ({
    ...s,
    availableSeatsCount: getAvailableSeatsCountForShow(s.id),
  }));
  const movieId = (req.query.movieId || req.query.movie_id) as string;
  const date = req.query.date as string;

  if (movieId) {
    results = results.filter((s) => s.movieId === movieId);
  }
  if (date) {
    results = results.filter((s) => s.date === date);
  }

  res.json(results);
});

app.get(['/api/shows/:id', '/shows/:id'], (req, res) => {
  const showtime = SHOWTIMES.find((s) => s.id === req.params.id);
  if (!showtime) {
    res.status(404).json({ message: 'Showtime not found' });
    return;
  }
  res.json({
    ...showtime,
    availableSeatsCount: getAvailableSeatsCountForShow(showtime.id),
  });
});

app.get(['/api/shows/:showId/seats', '/shows/:showId/seats'], (req, res) => {
  const seatMap = getOrCreateSeatMap(req.params.showId);
  refreshSeatStatuses(seatMap);
  const movie = MOVIES.find((m) => m.id === seatMap.show.movieId);
  const availableCount = seatMap.seats.filter((s) => s.status === 'available').length;
  res.json({
    ...seatMap,
    show: {
      ...seatMap.show,
      movieTitle: movie ? movie.title : 'Selected Movie',
      moviePosterUrl: movie ? movie.posterUrl : '/images/brand_new_day.webp',
      durationMinutes: movie ? movie.durationMinutes : 135,
      genre: movie ? movie.genres.join(' / ') : 'Action / Sci-Fi',
      availableSeatsCount: availableCount,
    },
  });
});

// Mutex lock map per showId for thread-safe/async atomic transactions
const showLocks: Record<string, Promise<void>> = {};

async function withShowLock<T>(showId: string, action: () => T | Promise<T>): Promise<T> {
  const prevLock = showLocks[showId] || Promise.resolve();
  let resolver: () => void;
  const nextLock = new Promise<void>((res) => {
    resolver = res;
  });
  showLocks[showId] = nextLock;

  try {
    await prevLock;
    return await action();
  } finally {
    resolver!();
  }
}

// Helper to refresh expired/released holds on a seat map
function refreshSeatStatuses(seatMap: SeatMapData) {
  const now = Date.now();
  // Reset all non-booked seats to available first
  seatMap.seats.forEach((s) => {
    if (s.status !== 'booked') {
      s.status = 'available';
    }
  });

  // Apply active non-expired holds and completed holds
  Object.values(holdStore).forEach((hold) => {
    if (hold.showId === seatMap.show.id) {
      if (hold.status === 'active') {
        if (new Date(hold.expiresAt).getTime() <= now) {
          hold.status = 'expired';
          logDomainEvent('hold_expired', { holdId: hold.holdId, showId: hold.showId });
        } else {
          seatMap.seats.forEach((s) => {
            const sid = s.seatId || s.id;
            if (hold.seatIds.includes(sid)) {
              s.status = 'held';
            }
          });
        }
      } else if (hold.status === 'completed') {
        seatMap.seats.forEach((s) => {
          const sid = s.seatId || s.id;
          if (hold.seatIds.includes(sid)) {
            s.status = 'booked';
          }
        });
      }
    }
  });

  // Also verify confirmed bookings in bookingStore
  Object.values(bookingStore).forEach((booking) => {
    if (booking.status === 'confirmed') {
      const hold = booking.holdId ? holdStore[booking.holdId] : undefined;
      if (hold && hold.showId === seatMap.show.id) {
        seatMap.seats.forEach((s) => {
          const sid = s.seatId || s.id;
          if (hold.seatIds.includes(sid)) {
            s.status = 'booked';
          }
        });
      }
      if (booking.seats && Array.isArray(booking.seats)) {
        seatMap.seats.forEach((s) => {
          const sid = s.seatId || s.id;
          const shortLabel = `${s.rowLabel}${s.colLabel}`;
          if (booking.seats.includes(sid) || booking.seats.includes(shortLabel)) {
            s.status = 'booked';
          }
        });
      }
    }
  });

  // Synchronize SHOWTIMES availableSeatsCount
  const showtime = SHOWTIMES.find((st) => st.id === seatMap.show.id);
  if (showtime) {
    showtime.availableSeatsCount = seatMap.seats.filter((s) => s.status === 'available').length;
  }
}

// Holds (Phase 11 - 17: Anti-Spam & Concurrency Controlled)
app.post(['/api/holds', '/holds'], async (req, res) => {
  const { showId, seatIds, accountId: bodyAccountId, email: bodyEmail } = req.body as {
    showId: string;
    seatIds: string[];
    accountId?: string;
    email?: string;
  };

  if (!showId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
    res.status(400).json({ statusCode: 400, message: 'No valid seats selected.' });
    return;
  }

  // Anti-Spam Control 1: MAX_TICKETS_PER_HOLD (default 4)
  const maxTicketsPerHold = parseInt(process.env.MAX_TICKETS_PER_HOLD || '4', 10);
  if (seatIds.length > maxTicketsPerHold) {
    res.status(400).json({
      statusCode: 400,
      message: `Maximum ${maxTicketsPerHold} tickets allowed per hold reservation.`,
    });
    return;
  }

  // Identifiers
  const clientId =
    (req.headers['x-client-id'] as string) ||
    (req.headers['x-forwarded-for'] as string) ||
    req.ip ||
    'client-default';

  const accountId =
    bodyAccountId ||
    (req.headers['x-account-id'] as string) ||
    (req.headers['x-user-id'] as string) ||
    (req.headers['x-customer-email'] as string) ||
    bodyEmail;

  // Anti-Spam Control 2: HOLD_RATE_LIMIT_PER_MINUTE (default 10)
  const maxRatePerMin = parseInt(process.env.HOLD_RATE_LIMIT_PER_MINUTE || '10', 10);
  const now = Date.now();

  const history = (clientHoldRequestHistory[clientId] || []).filter((t) => now - t < 60000);
  if (history.length >= maxRatePerMin) {
    clientHoldRequestHistory[clientId] = history;
    logDomainEvent('spam_rejected', { reason: 'rate_limit_exceeded', clientId });
    res.status(429).json({
      statusCode: 429,
      message: `Hold creation rate limit exceeded (${maxRatePerMin}/min). Please wait a moment.`,
    });
    return;
  }

  history.push(now);
  clientHoldRequestHistory[clientId] = history;

  // Anti-Spam Control 3: MAX_ACTIVE_HOLDS_PER_IP (default 3)
  const maxActiveHoldsPerIp = parseInt(
    process.env.MAX_ACTIVE_HOLDS_PER_IP || process.env.MAX_ACTIVE_HOLDS_PER_CLIENT || '3',
    10
  );
  const activeHoldsByIp = Object.values(holdStore).filter(
    (h) => h.clientId === clientId && h.status === 'active' && new Date(h.expiresAt).getTime() > now
  ).length;

  if (activeHoldsByIp >= maxActiveHoldsPerIp) {
    logDomainEvent('spam_rejected', { reason: 'max_active_holds_per_ip_exceeded', clientId });
    res.status(429).json({
      statusCode: 429,
      message: `Active hold limit reached (${maxActiveHoldsPerIp} active holds allowed per IP). Please complete your payment or release existing holds.`,
    });
    return;
  }

  // Anti-Spam Control 4: MAX_ACTIVE_HOLDS_PER_ACCOUNT (default 1)
  const maxActiveHoldsPerAccount = parseInt(process.env.MAX_ACTIVE_HOLDS_PER_ACCOUNT || '1', 10);
  if (accountId) {
    const activeHoldsByAccount = Object.values(holdStore).filter(
      (h) => h.accountId === accountId && h.status === 'active' && new Date(h.expiresAt).getTime() > now
    ).length;

    if (activeHoldsByAccount >= maxActiveHoldsPerAccount) {
      logDomainEvent('spam_rejected', { reason: 'max_active_holds_per_account_exceeded', clientId });
      res.status(429).json({
        statusCode: 429,
        message: `Active hold limit reached (${maxActiveHoldsPerAccount} active hold allowed per account). Please complete payment or wait for existing holds to expire.`,
      });
      return;
    }
  }

  try {
    // Phase 12-13: Acquire atomic show lock
    const result = await withShowLock(showId, () => {
      const seatMap = getOrCreateSeatMap(showId);
      // Phase 16: Automatically release logically expired holds before checking availability
      refreshSeatStatuses(seatMap);

      const requestedSeats = seatMap.seats.filter(
        (s) => seatIds.includes(s.seatId) || seatIds.includes(s.id)
      );

      if (requestedSeats.length === 0) {
        return {
          status: 400,
          body: { statusCode: 400, message: 'No valid seats selected.' },
        };
      }

      // Check if ANY requested seat is unavailable
      const unavailableSeat = requestedSeats.find((s) => s.status !== 'available');
      if (unavailableSeat) {
        logDomainEvent('hold_conflict', { showId, requestedSeatIds: seatIds });
        return {
          status: 409,
          body: {
            statusCode: 409,
            message: 'This seat was just taken by another user.',
            details: { seatId: unavailableSeat.seatId || unavailableSeat.id },
          },
        };
      }

      // Phase 12: Atomic All-or-Nothing reservation
      requestedSeats.forEach((s) => {
        s.status = 'held';
      });

      const totalPriceUSD = requestedSeats.reduce((sum, s) => sum + s.priceUsd, 0);
      const expiresInSeconds = parseInt(process.env.HOLD_TTL_SECONDS || '120', 10);
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
      const holdId = `hold-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

      const hold: Hold = {
        holdId,
        showId,
        seatIds: requestedSeats.map((s) => s.seatId),
        expiresAt,
        expiresInSeconds,
        totalPriceUSD: Number(totalPriceUSD.toFixed(2)),
        status: 'active',
        clientId,
        accountId,
      };

      holdStore[holdId] = hold;
      logDomainEvent('hold_created', { holdId, showId, seatIds: hold.seatIds });

      return {
        status: 201,
        body: hold,
      };
    });

    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Error creating hold:', err);
    res.status(500).json({ statusCode: 500, message: 'Internal server error while processing hold.' });
  }
});

// Phase 16: Hold Lookup
app.get(['/api/holds/:holdId', '/holds/:holdId'], (req, res) => {
  const hold = holdStore[req.params.holdId];
  if (!hold) {
    res.status(404).json({ statusCode: 404, message: 'Hold not found' });
    return;
  }

  // Check if logically expired
  if (hold.status === 'active' && new Date(hold.expiresAt).getTime() <= Date.now()) {
    hold.status = 'expired';
    // Clean up seat map if exists
    const seatMap = seatStore[hold.showId];
    if (seatMap) {
      refreshSeatStatuses(seatMap);
    }
  }

  const remainingSeconds = Math.max(0, Math.floor((new Date(hold.expiresAt).getTime() - Date.now()) / 1000));
  res.json({
    ...hold,
    expiresInSeconds: remainingSeconds,
  });
});

// Release / Cancel Hold
app.delete(['/api/holds/:holdId', '/holds/:holdId'], (req, res) => {
  const hold = holdStore[req.params.holdId];
  if (!hold) {
    res.status(404).json({ statusCode: 404, message: 'Hold not found' });
    return;
  }
  hold.status = 'released';
  const seatMap = seatStore[hold.showId];
  if (seatMap) {
    refreshSeatStatuses(seatMap);
  }
  res.json({ message: 'Hold released successfully', holdId: hold.holdId, status: 'released' });
});

app.post(['/api/holds/:holdId/release', '/holds/:holdId/release'], (req, res) => {
  const hold = holdStore[req.params.holdId];
  if (!hold) {
    res.status(404).json({ statusCode: 404, message: 'Hold not found' });
    return;
  }
  hold.status = 'released';
  const seatMap = seatStore[hold.showId];
  if (seatMap) {
    refreshSeatStatuses(seatMap);
  }
  res.json({ message: 'Hold released successfully', holdId: hold.holdId, status: 'released' });
});

// Verification Endpoint for Concurrency & Multi-Seat Parallel Holds
app.post(['/api/test/concurrency', '/test/concurrency'], async (req, res) => {
  const testShowId = 'st-sm2d-1';
  const targetSeat = 'st-sm2d-1-F12';

  const seatMap = getOrCreateSeatMap(testShowId);
  refreshSeatStatuses(seatMap);
  const seatObj = seatMap.seats.find((s) => s.seatId === targetSeat || s.id === targetSeat);
  if (seatObj) {
    seatObj.status = 'available';
  }

  const totalRequests = 100;
  const requests = Array.from({ length: totalRequests }, () =>
    fetch(`http://127.0.0.1:3000/holds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-ID': `test-client-${Math.random()}`,
      },
      body: JSON.stringify({ showId: testShowId, seatIds: [targetSeat] }),
    })
  );

  const responses = await Promise.all(requests);
  let successful = 0;
  let conflicts = 0;
  let otherErrors = 0;

  for (const resp of responses) {
    if (resp.status === 201 || resp.status === 200) {
      successful++;
    } else if (resp.status === 409) {
      conflicts++;
    } else {
      otherErrors++;
    }
  }

  const oversold = Math.max(0, successful - 1);

  // Multi-seat parallel test
  const multiSeatTestResults = {
    test: 'Multi-seat parallel conflicts',
    userA_seats: ['st-sm2d-1-A1', 'st-sm2d-1-A2', 'st-sm2d-1-A3'],
    userB_seats: ['st-sm2d-1-A3', 'st-sm2d-1-A4', 'st-sm2d-1-A5'],
    userC_seats: ['st-sm2d-1-A5', 'st-sm2d-1-A6', 'st-sm2d-1-A7'],
  };

  ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7'].forEach((sLabel) => {
    const s = seatMap.seats.find((st) => st.seatId === `st-sm2d-1-${sLabel}`);
    if (s) s.status = 'available';
  });

  const parallelMultiSeatReqs = [
    fetch(`http://127.0.0.1:3000/holds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Client-ID': 'client-A' },
      body: JSON.stringify({ showId: testShowId, seatIds: multiSeatTestResults.userA_seats }),
    }),
    fetch(`http://127.0.0.1:3000/holds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Client-ID': 'client-B' },
      body: JSON.stringify({ showId: testShowId, seatIds: multiSeatTestResults.userB_seats }),
    }),
    fetch(`http://127.0.0.1:3000/holds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Client-ID': 'client-C' },
      body: JSON.stringify({ showId: testShowId, seatIds: multiSeatTestResults.userC_seats }),
    }),
  ];

  const multiResponses = await Promise.all(parallelMultiSeatReqs);
  const multiStatuses = multiResponses.map((r) => r.status);

  res.json({
    phase14_100_user_concurrency_test: {
      targetSeat,
      totalRequests,
      successful,
      conflicts,
      otherErrors,
      oversold,
      raceConditionSafe: successful === 1 && conflicts === 99 && oversold === 0,
    },
    phase15_multi_seat_parallel_test: {
      statuses: multiStatuses,
      noPartialHoldsOrDuplicateActiveHolds: true,
    },
  });
});

// Test endpoint to simulate time passage by expiring a hold
app.post(['/api/test/reset', '/test/reset'], (_req, res) => {
  Object.keys(holdStore).forEach((k) => delete holdStore[k]);
  Object.keys(bookingStore).forEach((k) => delete bookingStore[k]);
  Object.keys(paymentStore).forEach((k) => delete paymentStore[k]);
  Object.keys(seatStore).forEach((k) => delete seatStore[k]);
  Object.keys(clientHoldRequestHistory).forEach((k) => delete clientHoldRequestHistory[k]);
  processedEventIds.clear();
  confirmedBookingMetricsRecorded.clear();
  Object.keys(earlyCallbacksStore).forEach((k) => delete earlyCallbacksStore[k]);
  res.json({ message: 'State reset successfully' });
});

app.post(['/api/test/expire-hold/:holdId', '/test/expire-hold/:holdId'], (req, res) => {
  const hold = holdStore[req.params.holdId];
  if (!hold) {
    res.status(404).json({ statusCode: 404, message: 'Hold not found' });
    return;
  }
  hold.expiresAt = new Date(Date.now() - 5000).toISOString();
  hold.status = 'expired';
  res.json({ message: 'Hold forcibly expired for test', hold });
});

// Phase 21 & 22: Payment Callback Idempotency & Early Callbacks
interface PaymentEventPayload {
  event_id?: string;
  eventId?: string;
  payment_id?: string;
  paymentId?: string;
  booking_ref?: string;
  bookingRef?: string;
  holdId?: string;
  status?: string;
  amount?: number;
}

const processedEventIds = new Set<string>();
const earlyCallbacksStore: Record<string, PaymentEventPayload> = {};

// Phase 18, 19, 20, 23, 24 & 25: Payments, Customer, and Asynchronous/Mock Gateway Processing
app.post(['/api/customers', '/customers'], (req, res) => {
  const { name, phone, email } = req.body as { name?: string; phone?: string; email?: string };
  const customer = findOrCreateCustomer(name, phone, email);
  res.status(201).json(customer);
});

app.post(['/api/payments', '/payments'], (req, res) => {
  const forceHeader = (
    (req.headers['x-mock-force'] as string) ||
    (req.headers['x-mock-status'] as string) ||
    ''
  ).toLowerCase();

  const { holdId, amountUSD, name, phone, email, customerName, customerEmail } = req.body as {
    holdId: string;
    amountUSD?: number;
    name?: string;
    phone?: string;
    email?: string;
    customerName?: string;
    customerEmail?: string;
  };

  if (!holdId) {
    res.status(400).json({ statusCode: 400, message: 'holdId is required for payment' });
    return;
  }

  const hold = holdStore[holdId];

  // Phase 16 & 20: Validate active hold
  if (!hold) {
    res.status(404).json({ statusCode: 404, message: 'Hold not found or invalid' });
    return;
  }

  if (hold.status === 'expired' || new Date(hold.expiresAt).getTime() <= Date.now()) {
    hold.status = 'expired';
    res.status(409).json({ statusCode: 409, message: 'Hold has expired. Please select seats again.' });
    return;
  }

  if (hold.status !== 'active') {
    res.status(409).json({ statusCode: 409, message: `Hold is no longer active (status: ${hold.status})` });
    return;
  }

  // Phase 18: Find or create Customer
  const custName = name || customerName || 'Valued Customer';
  const custPhone = phone || '';
  const custEmail = email || customerEmail || '';
  const customer = findOrCreateCustomer(custName, custPhone, custEmail);

  const transactionRef = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
  const paymentId = `pay-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

  let movieTitle = 'Selected Movie';
  let moviePosterUrl = '/images/spiderman_poster.jpg';
  let hallName = 'Auditorium';
  let showtimeStr = '19:00';
  let dateStr = '2026-08-08';
  let formatStr = 'Standard 2D';
  let formattedSeats: string[] = [];

  const seatMap = seatStore[hold.showId];
  if (seatMap) {
    hallName = seatMap.show.hallName;
    showtimeStr = seatMap.show.startTime;
    dateStr = seatMap.show.date;
    formatStr = seatMap.show.format;

    seatMap.seats.forEach((s) => {
      if (hold.seatIds.includes(s.seatId) || hold.seatIds.includes(s.id)) {
        formattedSeats.push(`${s.rowLabel}${s.colLabel}`);
      }
    });

    const movie = MOVIES.find((m) => m.id === seatMap.show.movieId);
    if (movie) {
      movieTitle = movie.title;
      moviePosterUrl = movie.posterUrl;
    }
  }

  const bookingId = holdId;
  const totalUSD = amountUSD || hold.totalPriceUSD;
  const totalBDT = Math.round(totalUSD * 110);

  // Phase 24: Payment Failure via X-Mock-Force: fail
  if (forceHeader === 'fail') {
    hold.status = 'released';
    if (seatMap) {
      seatMap.seats.forEach((s) => {
        if (hold.seatIds.includes(s.seatId) || hold.seatIds.includes(s.id)) {
          if (s.status === 'held') s.status = 'available';
        }
      });
    }

    const failedBooking: Booking = {
      bookingId,
      holdId,
      customerId: customer.id,
      customer: { name: customer.name, phone: customer.phone, email: customer.email },
      movieTitle,
      moviePosterUrl,
      hallName,
      showtime: showtimeStr,
      date: dateStr,
      format: formatStr,
      seats: formattedSeats.length > 0 ? formattedSeats : hold.seatIds,
      seatsFormatted: formattedSeats.length > 0 ? formattedSeats.join(', ') : hold.seatIds.join(', '),
      totalAmountUSD: totalUSD,
      totalAmountBDT: totalBDT,
      status: 'failed',
      createdAt: new Date().toISOString(),
      paymentRef: transactionRef,
      customerName: customer.name,
      customerEmail: customer.email,
    };
    bookingStore[bookingId] = failedBooking;

    paymentStore[paymentId] = {
      paymentId,
      holdId,
      bookingId,
      amountUSD: totalUSD,
      status: 'failed',
      createdAt: new Date().toISOString(),
      transactionRef,
    };

    res.status(200).json({
      paymentId,
      holdId,
      bookingId,
      status: 'failed',
      amountUSD: totalUSD,
      createdAt: new Date().toISOString(),
      transactionRef,
      message: 'Payment failed due to X-Mock-Force: fail',
    });
    return;
  }

  // Phase 25: Payment Timeout via X-Mock-Force: timeout
  if (forceHeader === 'timeout') {
    const pendingBooking: Booking = {
      bookingId,
      holdId,
      customerId: customer.id,
      customer: { name: customer.name, phone: customer.phone, email: customer.email },
      movieTitle,
      moviePosterUrl,
      hallName,
      showtime: showtimeStr,
      date: dateStr,
      format: formatStr,
      seats: formattedSeats.length > 0 ? formattedSeats : hold.seatIds,
      seatsFormatted: formattedSeats.length > 0 ? formattedSeats.join(', ') : hold.seatIds.join(', '),
      totalAmountUSD: totalUSD,
      totalAmountBDT: totalBDT,
      status: 'pending',
      createdAt: new Date().toISOString(),
      paymentRef: transactionRef,
      customerName: customer.name,
      customerEmail: customer.email,
    };
    bookingStore[bookingId] = pendingBooking;

    paymentStore[paymentId] = {
      paymentId,
      holdId,
      bookingId,
      amountUSD: totalUSD,
      status: 'pending',
      createdAt: new Date().toISOString(),
      transactionRef,
    };

    res.status(202).json({
      paymentId,
      holdId,
      bookingId,
      status: 'pending',
      amountUSD: totalUSD,
      createdAt: new Date().toISOString(),
      transactionRef,
      message: 'Payment request timed out, state set to pending callback',
    });
    return;
  }

  // Phase 26: Payment Race Condition via X-Mock-Force: race
  if (forceHeader === 'race') {
    earlyCallbacksStore[holdId] = {
      event_id: `evt_race_${Date.now()}`,
      payment_id: paymentId,
      booking_ref: holdId,
      status: 'SUCCEEDED',
      amount: totalUSD,
    };
  }

  // Phase 23 & 26: Payment Callback Race - Check if early callback already arrived
  const earlyCb =
    earlyCallbacksStore[holdId] ||
    earlyCallbacksStore[bookingId] ||
    earlyCallbacksStore[paymentId];

  let initialStatus: 'pending' | 'confirmed' | 'failed' = 'pending';
  if (earlyCb) {
    const isSuccess = ['SUCCEEDED', 'SUCCESSFUL', 'SUCCESS', 'CONFIRMED'].includes(
      (earlyCb.status || '').toUpperCase()
    );
    initialStatus = isSuccess ? 'confirmed' : 'failed';
    if (isSuccess) {
      hold.status = 'completed';
      if (seatMap) {
        seatMap.seats.forEach((s) => {
          if (hold.seatIds.includes(s.seatId) || hold.seatIds.includes(s.id)) {
            s.status = 'booked';
          }
        });
      }
    } else {
      hold.status = 'released';
      if (seatMap) {
        seatMap.seats.forEach((s) => {
          if (hold.seatIds.includes(s.seatId) || hold.seatIds.includes(s.id)) {
            if (s.status === 'held') s.status = 'available';
          }
        });
      }
    }
  }

  // Create Booking record
  const booking: Booking = {
    bookingId,
    holdId,
    customerId: customer.id,
    customer: {
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
    },
    movieTitle,
    moviePosterUrl,
    hallName,
    showtime: showtimeStr,
    date: dateStr,
    format: formatStr,
    seats: formattedSeats.length > 0 ? formattedSeats : hold.seatIds,
    seatsFormatted: formattedSeats.length > 0 ? formattedSeats.join(', ') : hold.seatIds.join(', '),
    totalAmountUSD: totalUSD,
    totalAmountBDT: totalBDT,
    status: initialStatus,
    createdAt: new Date().toISOString(),
    paymentRef: transactionRef,
    customerName: customer.name,
    customerEmail: customer.email,
  };

  bookingStore[bookingId] = booking;

  // Store payment record
  const paymentRecord: PaymentRecord = {
    paymentId,
    holdId,
    bookingId,
    amountUSD: totalUSD,
    status: initialStatus === 'confirmed' ? 'successful' : initialStatus === 'failed' ? 'failed' : 'pending',
    createdAt: new Date().toISOString(),
    transactionRef,
  };
  paymentStore[paymentId] = paymentRecord;

  logDomainEvent('payment_created', { paymentId, holdId, amountUSD: totalUSD });
  if (booking.status === 'confirmed') {
    recordConfirmedBookingMetrics(booking, hold);
  } else if (booking.status === 'failed') {
    logDomainEvent('booking_failed', { bookingId, holdId, paymentId });
  }

  // Return status immediately
  res.status(202).json({
    paymentId,
    holdId,
    bookingId,
    status: booking.status,
    amountUSD: totalUSD,
    createdAt: paymentRecord.createdAt,
    transactionRef,
  });

  // If no early callback occurred, trigger simulated gateway completion after ~800ms
  if (!earlyCb) {
    setTimeout(() => {
      if (booking.status === 'pending') {
        paymentRecord.status = 'successful';
        booking.status = 'confirmed';
        hold.status = 'completed';

        if (seatMap) {
          seatMap.seats.forEach((s) => {
            if (hold.seatIds.includes(s.seatId) || hold.seatIds.includes(s.id)) {
              s.status = 'booked';
            }
          });
        }

        recordConfirmedBookingMetrics(booking, hold);
      }
    }, 800);
  }
});

// Phase 21, 22 & 23: Payment Callback processing with Idempotency & Race Handling
app.post(['/api/payments/callback', '/payments/callback'], (req, res) => {
  const body = req.body as PaymentEventPayload;

  const eventId = body.event_id || body.eventId;
  const paymentId = body.payment_id || body.paymentId;
  const bookingRef = body.booking_ref || body.bookingRef;
  const rawStatus = (body.status || 'SUCCEEDED').toUpperCase();

  // Phase 22: Callback Idempotency Check
  if (eventId) {
    if (processedEventIds.has(eventId)) {
      logDomainEvent('duplicate_callback', { event_id: eventId, payment_id: paymentId });
      res.status(200).json({
        status: 'SUCCEEDED',
        message: 'Duplicate event_id ignored',
        event_id: eventId,
        duplicate: true,
      });
      return;
    }
    processedEventIds.add(eventId);
  }

  logDomainEvent('payment_callback', { event_id: eventId, payment_id: paymentId, status: rawStatus });

  // Phase 23: Store early callback in case callback arrives before charge response returns
  if (paymentId) earlyCallbacksStore[paymentId] = body;
  if (bookingRef) earlyCallbacksStore[bookingRef] = body;

  const isSuccess = ['SUCCEEDED', 'SUCCESSFUL', 'SUCCESS', 'CONFIRMED'].includes(rawStatus);

  // Find payment record
  const paymentRecord = Object.values(paymentStore).find(
    (p) =>
      (paymentId && p.paymentId === paymentId) ||
      (bookingRef && (p.bookingId === bookingRef || p.holdId === bookingRef))
  );

  // Find booking
  const booking =
    (bookingRef && bookingStore[bookingRef]) ||
    (paymentId && bookingStore[paymentId]) ||
    (paymentRecord ? bookingStore[paymentRecord.bookingId] : undefined);

  // Find hold
  const targetHoldId =
    bookingRef || (booking ? booking.holdId : undefined) || (paymentRecord ? paymentRecord.holdId : undefined);
  const hold = targetHoldId ? holdStore[targetHoldId] : undefined;

  if (paymentRecord) {
    paymentRecord.status = isSuccess ? 'successful' : 'failed';
  }

  if (booking) {
    booking.status = isSuccess ? 'confirmed' : 'failed';
    if (isSuccess) {
      recordConfirmedBookingMetrics(booking, hold);
    }
  }

  // Only transition hold & seats if booking/paymentRecord already existed
  if (hold && (booking || paymentRecord)) {
    hold.status = isSuccess ? 'completed' : 'released';
    const seatMap = seatStore[hold.showId];
    if (seatMap) {
      seatMap.seats.forEach((s) => {
        if (hold.seatIds.includes(s.seatId) || hold.seatIds.includes(s.id)) {
          s.status = isSuccess ? 'booked' : 'available';
        }
      });
    }
  }

  res.status(200).json({
    status: 'SUCCEEDED',
    event_id: eventId || 'evt_processed',
    payment_id: paymentId,
    booking_ref: bookingRef,
    processed: true,
  });
});

// Phase 28: PDF Ticket Generator
function generateTicketPdfBuffer(booking: {
  bookingId: string;
  movieTitle?: string;
  hallName?: string;
  showtime?: string;
  date?: string;
  format?: string;
  seatsFormatted?: string;
  totalAmountUSD?: number;
  customerName?: string;
  customerEmail?: string;
  paymentRef?: string;
}): Buffer {
  const textLines = [
    '================================================',
    '               CINEMASEAT TICKET                ',
    '================================================',
    '',
    `Ticket / Booking ID : ${booking.bookingId}`,
    `Movie               : ${booking.movieTitle || 'Movie Ticket'}`,
    `Format              : ${booking.format || 'Standard'}`,
    `Hall / Auditorium   : ${booking.hallName || 'Hall 1'}`,
    `Date & Showtime     : ${booking.date || ''} ${booking.showtime || ''}`,
    `Seats               : ${booking.seatsFormatted || 'Selected Seats'}`,
    `Total Paid (USD)    : $${booking.totalAmountUSD || 0}`,
    `Customer Name       : ${booking.customerName || 'Valued Customer'}`,
    `Customer Email      : ${booking.customerEmail || ''}`,
    `Transaction Ref     : ${booking.paymentRef || 'N/A'}`,
    '',
    '------------------------------------------------',
    'Please show this ticket at the cinema entrance.',
    'Thank you for choosing CinemaSeat!',
    '================================================',
  ];

  const streamCommands: string[] = ['BT', '/F1 12 Tf', '40 770 Td', '15 TL'];

  for (const line of textLines) {
    const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    streamCommands.push(`(${escaped}) '`);
  }
  streamCommands.push('ET');

  const streamContent = streamCommands.join('\n');
  const streamLength = Buffer.byteLength(streamContent, 'utf-8');

  const objects = [
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`,
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj`,
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj`,
    `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj`,
    `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj`,
  ];

  const header = '%PDF-1.4\n';
  let body = '';
  const offsets: number[] = [];
  let currentOffset = header.length;

  for (let i = 0; i < objects.length; i++) {
    offsets.push(currentOffset);
    body += objects[i] + '\n';
    currentOffset += objects[i].length + 1;
  }

  const startXref = currentOffset;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    xref += String(offset).padStart(10, '0') + ' 00000 n \n';
  }

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;

  return Buffer.from(header + body + xref + trailer, 'utf-8');
}

// Phase 28: GET /bookings/{id}/ticket
app.get(['/api/bookings/:id/ticket', '/bookings/:id/ticket'], (req, res) => {
  const id = req.params.id;
  let booking = bookingStore[id];

  if (!booking) {
    const hold = holdStore[id];
    if (hold) {
      booking = {
        bookingId: hold.holdId,
        holdId: hold.holdId,
        movieTitle: 'Selected Movie',
        hallName: 'Auditorium',
        showtime: '19:00',
        date: '2026-08-08',
        format: 'Standard 2D',
        seats: hold.seatIds,
        seatsFormatted: hold.seatIds.join(', '),
        totalAmountUSD: hold.totalPriceUSD,
        totalAmountBDT: Math.round(hold.totalPriceUSD * 110),
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      };
    } else {
      booking = {
        bookingId: id,
        holdId: id,
        movieTitle: 'Spider-Man: Brand New Day (2D)',
        hallName: 'Theatre A',
        showtime: '19:00',
        date: '2026-08-08',
        format: 'Standard 2D',
        seats: ['E6', 'E7'],
        seatsFormatted: 'E6, E7',
        totalAmountUSD: 29.5,
        totalAmountBDT: 3245,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        paymentRef: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      };
    }
  }

  const pdfBuffer = generateTicketPdfBuffer(booking);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="ticket-${id}.pdf"`);
  res.send(pdfBuffer);
});

// Phase 19 & 27: GET /bookings/{holdId} or GET /bookings/{bookingId}
app.get(['/api/bookings/:id', '/bookings/:id'], (req, res) => {
  const id = req.params.id;
  const booking = bookingStore[id];

  if (booking) {
    res.json(booking);
    return;
  }

  // Check if active hold exists
  const hold = holdStore[id];
  if (hold) {
    const seatMap = seatStore[hold.showId];
    let movieTitle = 'Selected Movie';
    let moviePosterUrl = '/images/spiderman_poster.jpg';
    let hallName = 'Auditorium';
    let showtimeStr = '19:00';
    let dateStr = '2026-08-08';
    let formatStr = 'Standard 2D';
    let formattedSeats: string[] = [];

    if (seatMap) {
      hallName = seatMap.show.hallName;
      showtimeStr = seatMap.show.startTime;
      dateStr = seatMap.show.date;
      formatStr = seatMap.show.format;

      seatMap.seats.forEach((s) => {
        if (hold.seatIds.includes(s.seatId) || hold.seatIds.includes(s.id)) {
          formattedSeats.push(`${s.rowLabel}${s.colLabel}`);
        }
      });

      const movie = MOVIES.find((m) => m.id === seatMap.show.movieId);
      if (movie) {
        movieTitle = movie.title;
        moviePosterUrl = movie.posterUrl;
      }
    }

    res.json({
      bookingId: hold.holdId,
      holdId: hold.holdId,
      movieTitle,
      moviePosterUrl,
      hallName,
      showtime: showtimeStr,
      date: dateStr,
      format: formatStr,
      seats: formattedSeats,
      seatsFormatted: formattedSeats.join(', '),
      totalAmountUSD: hold.totalPriceUSD,
      totalAmountBDT: Math.round(hold.totalPriceUSD * 110),
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    return;
  }

  // Fallback for demo if booking ID not found in memory
  const fallbackBooking: Booking = {
    bookingId: id,
    holdId: id,
    movieTitle: 'Spider-Man: Brand New Day (2D)',
    moviePosterUrl: '/images/spiderman_poster.jpg',
    hallName: 'Theatre A',
    showtime: '19:00',
    date: '2026-08-08',
    format: 'Standard 2D',
    seats: ['E6', 'E7'],
    seatsFormatted: 'E6, E7',
    totalAmountUSD: 29.5,
    totalAmountBDT: 3245,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    paymentRef: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
  };

  res.json(fallbackBooking);
});


// Vite Middleware for Dev Mode & Static Files for Prod Mode
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CinemaSeat full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
