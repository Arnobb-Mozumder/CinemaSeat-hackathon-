-- CinemaSeat Database Initial Schema Migration

-- 1. Movies Table
CREATE TABLE movies (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    tagline VARCHAR(255),
    synopsis TEXT,
    duration_minutes INT NOT NULL,
    release_year INT NOT NULL,
    rating DECIMAL(3, 1),
    age_rating VARCHAR(16),
    genres TEXT, -- Comma-separated list of genres
    poster_url TEXT,
    banner_url TEXT,
    director VARCHAR(255),
    cast_members TEXT, -- Comma-separated list of cast members
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Shows Table (Showtimes)
CREATE TABLE shows (
    id VARCHAR(64) PRIMARY KEY,
    movie_id VARCHAR(64) NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    hall_id VARCHAR(64) NOT NULL,
    hall_name VARCHAR(255) NOT NULL,
    start_time VARCHAR(16) NOT NULL,
    show_date VARCHAR(16) NOT NULL,
    format VARCHAR(64) NOT NULL,
    base_price_usd DECIMAL(10, 2) NOT NULL,
    available_seats_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Seats Table (Physical layout)
CREATE TABLE seats (
    id VARCHAR(64) PRIMARY KEY,
    seat_row VARCHAR(16) NOT NULL,
    seat_number INT NOT NULL,
    tier VARCHAR(32) NOT NULL, -- standard, premium, vip
    hall_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. ShowSeats Table (Per-show seat availability)
CREATE TABLE show_seats (
    id VARCHAR(64) PRIMARY KEY,
    show_id VARCHAR(64) NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    seat_id VARCHAR(64) NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, HELD, BOOKED
    price_usd DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Holds Table
CREATE TABLE holds (
    id VARCHAR(64) PRIMARY KEY,
    show_id VARCHAR(64) NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    customer_email VARCHAR(255),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, RELEASED, CONVERTED
    total_price_usd DECIMAL(10, 2) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Join table for holds and show_seats
CREATE TABLE hold_seats (
    hold_id VARCHAR(64) NOT NULL REFERENCES holds(id) ON DELETE CASCADE,
    show_seat_id VARCHAR(64) NOT NULL REFERENCES show_seats(id) ON DELETE CASCADE,
    PRIMARY KEY (hold_id, show_seat_id)
);

-- 6. Customers Table
CREATE TABLE customers (
    id VARCHAR(64) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Bookings Table
CREATE TABLE bookings (
    id VARCHAR(64) PRIMARY KEY,
    show_id VARCHAR(64) NOT NULL REFERENCES shows(id),
    customer_id VARCHAR(64) REFERENCES customers(id),
    hold_id VARCHAR(64) REFERENCES holds(id),
    booking_reference VARCHAR(64) NOT NULL UNIQUE,
    total_amount_usd DECIMAL(10, 2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING, CONFIRMED, CANCELLED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Join table for booking seats
CREATE TABLE booking_seats (
    booking_id VARCHAR(64) NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    show_seat_id VARCHAR(64) NOT NULL REFERENCES show_seats(id) ON DELETE CASCADE,
    PRIMARY KEY (booking_id, show_seat_id)
);

-- 8. Payments Table
CREATE TABLE payments (
    id VARCHAR(64) PRIMARY KEY,
    booking_id VARCHAR(64) REFERENCES bookings(id),
    hold_id VARCHAR(64) REFERENCES holds(id),
    amount_usd DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING, SUCCESSFUL, FAILED
    transaction_ref VARCHAR(128),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. PaymentEvents Table
CREATE TABLE payment_events (
    id VARCHAR(64) PRIMARY KEY,
    payment_id VARCHAR(64) NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL,
    payload TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Data for Movies
INSERT INTO movies (id, title, tagline, synopsis, duration_minutes, release_year, rating, age_rating, genres, poster_url, banner_url, director, cast_members, is_featured)
VALUES
('m-spiderman-2d', 'Spider-Man: Brand New Day (2D)', 'A fresh chapter in the web-slinger saga.', 'Peter Parker navigates a brand new chapter filled with unexpected allies, emerging citywide threats, and fresh challenges in this 2D theatrical release.', 135, 2026, 8.8, 'PG-13', 'Action,Adventure,Sci-Fi', '/images/spiderman_poster.jpg', '/images/spiderman_banner.jpg', 'Destin Daniel Cretton', 'Tom Holland,Zendaya,Jacob Batalon', TRUE),
('m-spiderman-3d', 'Spider-Man: Brand New Day (3D)', 'Feel every swing in immersive 3D.', 'Experience the high-octane web-slinging spectacle of Spider-Man: Brand New Day in full 3D visual depth with enhanced spatial audio and effects.', 135, 2026, 9.1, 'PG-13', 'Action,Adventure,Sci-Fi', '/images/spiderman_3d_poster.jpg', '/images/spiderman_3d_banner.jpg', 'Destin Daniel Cretton', 'Tom Holland,Zendaya,Jacob Batalon', TRUE),
('m-avatar-3', 'Avatar: Fire and Ash', 'Discover the fire tribe of Pandora.', 'Jake Sully and Neytiri encounter a new, aggressive clan of Na''vi known as the Ash People in an uncharted region of Pandora.', 192, 2025, 8.9, 'PG-13', 'Sci-Fi,Adventure,Action', '/images/avatar_poster.jpg', '/images/avatar_banner.jpg', 'James Cameron', 'Sam Worthington,Zoe Saldaña,Sigourney Weaver', TRUE),
('m-inception-odyssey', 'Inception: Cosmic Rift', 'The mind is the scene of the crime.', 'A team of dream operatives embark on a deep-level subconscious extraction mission that threatens the fabric of physical reality.', 156, 2026, 9.0, 'PG-13', 'Sci-Fi,Thriller,Action', '/images/inception_poster.jpg', '/images/inception_banner.jpg', 'Christopher Nolan', 'Leonardo DiCaprio,Joseph Gordon-Levitt,Elliot Page', FALSE),
('m-dune-prophecy', 'Dune: Messiah Part 1', 'The desert power demands a reckoning.', 'Paul Atreides ascends the Emperor''s throne while facing cosmic conspiracies and religious fervour across the known universe.', 168, 2026, 9.2, 'PG-13', 'Sci-Fi,Adventure,Drama', '/images/dune_poster.jpg', '/images/dune_banner.jpg', 'Denis Villeneuve', 'Timothée Chalamet,Zendaya,Florence Pugh', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Seed Initial Shows
INSERT INTO shows (id, movie_id, hall_id, hall_name, start_time, show_date, format, base_price_usd, available_seats_count)
VALUES
('st-sm2d-1', 'm-spiderman-2d', 'hall-a', 'Theatre A', '19:00', '2026-08-08', 'Standard 2D', 450.00, 72),
('st-sm2d-2', 'm-spiderman-2d', 'hall-a', 'Theatre A', '22:00', '2026-08-08', 'Standard 2D', 450.00, 72),
('st-sm2d-3', 'm-spiderman-2d', 'hall-b', 'Theatre B', '20:30', '2026-08-08', 'Standard 2D', 400.00, 72),
('st-sm2d-4', 'm-spiderman-2d', 'hall-c', 'Theatre C', '16:15', '2026-08-08', 'Standard 2D', 400.00, 72),
('st-sm3d-1', 'm-spiderman-3d', 'hall-imax', 'IMAX Auditorium', '18:00', '2026-08-08', 'IMAX 3D', 850.00, 72),
('st-sm3d-2', 'm-spiderman-3d', 'hall-imax', 'IMAX Auditorium', '21:30', '2026-08-08', 'IMAX 3D', 850.00, 72),
('st-sm3d-3', 'm-spiderman-3d', 'hall-dolby', 'Dolby Cinema Screen 1', '19:45', '2026-08-08', 'Dolby Cinema', 750.00, 72),
('st-av3-1', 'm-avatar-3', 'hall-dolby', 'Dolby Cinema Screen 1', '17:00', '2026-08-08', 'Dolby Cinema', 800.00, 72),
('st-av3-2', 'm-avatar-3', 'hall-imax', 'IMAX Auditorium', '20:15', '2026-08-08', 'IMAX 3D', 900.00, 72),
('st-inc-1', 'm-inception-odyssey', 'hall-a', 'Theatre A', '18:30', '2026-08-08', 'Standard 2D', 450.00, 72),
('st-inc-2', 'm-inception-odyssey', 'hall-b', 'Theatre B', '21:15', '2026-08-08', 'Standard 2D', 450.00, 72),
('st-dune-1', 'm-dune-prophecy', 'hall-imax', 'IMAX Auditorium', '19:15', '2026-08-08', 'IMAX 3D', 900.00, 72),
('st-dune-2', 'm-dune-prophecy', 'hall-c', 'Theatre C', '22:15', '2026-08-08', 'Standard 2D', 500.00, 72)
ON CONFLICT (id) DO NOTHING;

-- Seed Physical Seats using pure SQL
INSERT INTO seats (id, seat_row, seat_number, tier, hall_id)
SELECT 
    h.hall_id || '-' || r.seat_row || n.seat_number AS id,
    r.seat_row,
    n.seat_number,
    CASE 
        WHEN r.seat_row IN ('C', 'D') THEN 'premium'
        WHEN r.seat_row IN ('E', 'F') THEN 'vip'
        ELSE 'standard'
    END AS tier,
    h.hall_id
FROM (VALUES ('hall-a'), ('hall-b'), ('hall-c'), ('hall-imax'), ('hall-dolby')) AS h(hall_id)
CROSS JOIN (VALUES ('A'), ('B'), ('C'), ('D'), ('E'), ('F')) AS r(seat_row)
CROSS JOIN (SELECT generate_series(1, 12) AS seat_number) AS n
ON CONFLICT (id) DO NOTHING;

-- Seed ShowSeats using pure SQL
INSERT INTO show_seats (id, show_id, seat_id, status, price_usd)
SELECT 
    sh.id || '-' || s.id AS id,
    sh.id AS show_id,
    s.id AS seat_id,
    'AVAILABLE' AS status,
    sh.base_price_usd + CASE 
        WHEN s.tier = 'premium' THEN 100.00
        WHEN s.tier = 'vip' THEN 200.00
        ELSE 0.00
    END AS price_usd
FROM shows sh
JOIN seats s ON s.hall_id = sh.hall_id
ON CONFLICT (id) DO NOTHING;
