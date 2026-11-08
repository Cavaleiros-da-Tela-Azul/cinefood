BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS cinema_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS roles (
  code text PRIMARY KEY CHECK (code IN ('CLIENTE', 'OPERADOR_PORTARIA', 'OPERADOR_CANTINA', 'RUNNER', 'ADMIN_CINEMA')),
  description text NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  password_hash text NOT NULL,
  role_code text NOT NULL REFERENCES roles(code),
  unit_id uuid REFERENCES cinema_units(id),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  synopsis text,
  rating text,
  duration_minutes integer CHECK (duration_minutes > 0),
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES cinema_units(id),
  name text NOT NULL,
  UNIQUE (unit_id, name)
);

CREATE TABLE IF NOT EXISTS screenings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id uuid NOT NULL REFERENCES movies(id),
  room_id uuid NOT NULL REFERENCES rooms(id),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  format text NOT NULL DEFAULT 'DIGITAL',
  active boolean NOT NULL DEFAULT true,
  CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  row_label text NOT NULL,
  seat_number integer NOT NULL CHECK (seat_number > 0),
  UNIQUE (room_id, row_label, seat_number)
);

CREATE TABLE IF NOT EXISTS screening_seats (
  screening_id uuid NOT NULL REFERENCES screenings(id) ON DELETE CASCADE,
  seat_id uuid NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'DISPONIVEL' CHECK (status IN ('DISPONIVEL', 'RESERVADO', 'OCUPADO')),
  PRIMARY KEY (screening_id, seat_id)
);

CREATE INDEX IF NOT EXISTS idx_screenings_active_date ON screenings (starts_at) WHERE active;
CREATE INDEX IF NOT EXISTS idx_screening_seats_status ON screening_seats (screening_id, status);

CREATE TABLE IF NOT EXISTS privacy_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL,
  effective_from timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  term_id uuid NOT NULL REFERENCES privacy_terms(id),
  purpose text NOT NULL,
  granted boolean NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, term_id, purpose)
);

COMMIT;


