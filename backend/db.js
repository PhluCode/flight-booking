import { DatabaseSync } from 'node:sqlite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const db = new DatabaseSync(path.join(__dirname, 'database.db'))

db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name     TEXT NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    phone         TEXT,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS airports (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    code    TEXT UNIQUE NOT NULL,
    name    TEXT NOT NULL,
    city    TEXT NOT NULL,
    country TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS airlines (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS flights (
    id                     INTEGER PRIMARY KEY AUTOINCREMENT,
    flight_number          TEXT NOT NULL,
    airline_id             INTEGER REFERENCES airlines(id),
    origin_airport_id      INTEGER REFERENCES airports(id),
    destination_airport_id INTEGER REFERENCES airports(id),
    departure_time         DATETIME NOT NULL,
    arrival_time           DATETIME NOT NULL,
    duration               INTEGER NOT NULL,
    price                  REAL NOT NULL,
    stops                  INTEGER NOT NULL DEFAULT 0,
    gate                   TEXT,
    total_seats            INTEGER NOT NULL,
    cabin_class            TEXT DEFAULT 'Economy',
    status                 TEXT DEFAULT 'scheduled'
  );

  CREATE TABLE IF NOT EXISTS seats (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    flight_id   INTEGER REFERENCES flights(id),
    seat_number TEXT NOT NULL,
    class       TEXT DEFAULT 'economy',
    status      TEXT DEFAULT 'available',
    UNIQUE (flight_id, seat_number)
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id           INTEGER REFERENCES users(id),
    flight_id         INTEGER REFERENCES flights(id),
    booking_reference TEXT UNIQUE NOT NULL,
    status            TEXT DEFAULT 'pending',
    cabin_class       TEXT DEFAULT 'Economy',
    total_price       REAL NOT NULL,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS passengers (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id      INTEGER REFERENCES bookings(id),
    first_name      TEXT NOT NULL,
    last_name       TEXT NOT NULL,
    passport_number TEXT,
    seat_number     TEXT
  );

  CREATE TABLE IF NOT EXISTS payments (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id     INTEGER REFERENCES bookings(id),
    amount         REAL NOT NULL,
    status         TEXT DEFAULT 'pending',
    payment_method TEXT,
    paid_at        DATETIME
  );
`)

export default db
