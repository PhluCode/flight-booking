-- ============================================================
-- FLIGHT BOOKING DATABASE
-- Paste this into Supabase SQL Editor and click Run
-- ============================================================


-- ============================================================
-- SCHEMA
-- ============================================================

CREATE TABLE profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name  text,
  phone      text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE airports (
  id      serial PRIMARY KEY,
  code    varchar(3) UNIQUE NOT NULL,
  name    text NOT NULL,
  city    text NOT NULL,
  country text NOT NULL
);

CREATE TABLE airlines (
  id   serial PRIMARY KEY,
  code varchar(2) UNIQUE NOT NULL,
  name text NOT NULL
);

CREATE TABLE flights (
  id                     serial PRIMARY KEY,
  flight_number          varchar(10) NOT NULL,
  airline_id             int REFERENCES airlines(id),
  origin_airport_id      int REFERENCES airports(id),
  destination_airport_id int REFERENCES airports(id),
  departure_time         timestamptz NOT NULL,
  arrival_time           timestamptz NOT NULL,
  duration               int NOT NULL,        -- in minutes
  price                  numeric(10,2) NOT NULL,
  total_seats            int NOT NULL,
  status                 text DEFAULT 'scheduled'  -- scheduled, delayed, cancelled
);

CREATE TABLE seats (
  id          serial PRIMARY KEY,
  flight_id   int REFERENCES flights(id) ON DELETE CASCADE,
  seat_number varchar(5) NOT NULL,
  class       text DEFAULT 'economy',    -- economy, business
  status      text DEFAULT 'available',  -- available, occupied, blocked
  UNIQUE (flight_id, seat_number)
);

CREATE TABLE bookings (
  id                serial PRIMARY KEY,
  user_id           uuid REFERENCES profiles(id),
  flight_id         int REFERENCES flights(id),
  booking_reference varchar(8) UNIQUE NOT NULL,
  status            text DEFAULT 'pending',  -- pending, confirmed, cancelled
  total_price       numeric(10,2) NOT NULL,
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE passengers (
  id              serial PRIMARY KEY,
  booking_id      int REFERENCES bookings(id) ON DELETE CASCADE,
  first_name      text NOT NULL,
  last_name       text NOT NULL,
  passport_number text,
  seat_number     varchar(5)
);

CREATE TABLE payments (
  id             serial PRIMARY KEY,
  booking_id     int REFERENCES bookings(id) ON DELETE CASCADE,
  amount         numeric(10,2) NOT NULL,
  status         text DEFAULT 'pending',  -- pending, paid, refunded
  payment_method text,
  paid_at        timestamptz
);


-- ============================================================
-- SEED DATA
-- ============================================================

-- Airports
INSERT INTO airports (code, name, city, country) VALUES
  ('BKK', 'Suvarnabhumi Airport',     'Bangkok',    'Thailand'),
  ('DMK', 'Don Mueang Airport',        'Bangkok',    'Thailand'),
  ('CNX', 'Chiang Mai Airport',        'Chiang Mai', 'Thailand'),
  ('HKT', 'Phuket International Airport', 'Phuket', 'Thailand'),
  ('SIN', 'Changi Airport',            'Singapore',  'Singapore');

-- Airlines
INSERT INTO airlines (code, name) VALUES
  ('TG', 'Thai Airways'),
  ('FD', 'Thai AirAsia'),
  ('SQ', 'Singapore Airlines');

-- Flights (duration in minutes)
INSERT INTO flights (flight_number, airline_id, origin_airport_id, destination_airport_id, departure_time, arrival_time, duration, price, total_seats, status) VALUES
  ('TG100', 1, 1, 3, '2026-06-01 07:00:00+07', '2026-06-01 08:05:00+07',  65,  1800.00, 60, 'scheduled'),
  ('TG102', 1, 3, 1, '2026-06-01 09:30:00+07', '2026-06-01 10:35:00+07',  65,  1800.00, 60, 'scheduled'),
  ('FD300', 2, 1, 4, '2026-06-01 08:00:00+07', '2026-06-01 09:25:00+07',  85,  1200.00, 60, 'scheduled'),
  ('FD302', 2, 4, 1, '2026-06-01 10:30:00+07', '2026-06-01 11:55:00+07',  85,  1200.00, 60, 'scheduled'),
  ('TG410', 1, 1, 5, '2026-06-01 10:00:00+07', '2026-06-01 13:20:00+07', 140,  3500.00, 60, 'scheduled'),
  ('FD501', 2, 2, 3, '2026-06-02 06:30:00+07', '2026-06-02 07:40:00+07',  70,  1100.00, 60, 'scheduled');

-- Seats: rows 1-2 = business (A-F), rows 3-10 = economy (A-F)
-- Generates 60 seats per flight automatically
INSERT INTO seats (flight_id, seat_number, class, status)
SELECT
  f.id,
  row_num::text || seat_letter,
  CASE WHEN row_num <= 2 THEN 'business' ELSE 'economy' END,
  'available'
FROM flights f
CROSS JOIN generate_series(1, 10) AS row_num
CROSS JOIN unnest(ARRAY['A','B','C','D','E','F']) AS seat_letter;

-- ============================================================
-- TEST USERS
-- NOTE: Create these two users first via Supabase Dashboard
--   (Authentication > Users > Add User), then replace the
--   UUIDs below with the real ones before running this block.
-- ============================================================

-- INSERT INTO profiles (id, full_name, phone) VALUES
--   ('REPLACE-WITH-USER-1-UUID', 'Somchai Jaidee',   '0812345678'),
--   ('REPLACE-WITH-USER-2-UUID', 'Nattaya Srisuk',   '0898765432');

-- ============================================================
-- SAMPLE BOOKINGS
-- Uncomment after inserting profiles above
-- ============================================================

-- INSERT INTO bookings (user_id, flight_id, booking_reference, status, total_price) VALUES
--   ('REPLACE-WITH-USER-1-UUID', 1, 'AB12CD34', 'confirmed', 1800.00),
--   ('REPLACE-WITH-USER-1-UUID', 5, 'EF56GH78', 'confirmed', 7000.00),
--   ('REPLACE-WITH-USER-2-UUID', 3, 'IJ90KL12', 'pending',   1200.00);

-- INSERT INTO passengers (booking_id, first_name, last_name, passport_number, seat_number) VALUES
--   (1, 'Somchai',  'Jaidee',  'TH1234567', '5A'),
--   (2, 'Somchai',  'Jaidee',  'TH1234567', '3C'),
--   (2, 'Malee',    'Jaidee',  'TH7654321', '3D'),
--   (3, 'Nattaya',  'Srisuk',  'TH9876543', '4B');

-- UPDATE seats SET status = 'occupied'
-- WHERE flight_id = 1 AND seat_number = '5A';
-- UPDATE seats SET status = 'occupied'
-- WHERE flight_id = 5 AND seat_number IN ('3C', '3D');

-- INSERT INTO payments (booking_id, amount, status, payment_method, paid_at) VALUES
--   (1, 1800.00, 'paid',    'credit_card', now()),
--   (2, 7000.00, 'paid',    'promptpay',   now()),
--   (3, 1200.00, 'pending', 'credit_card', null);
