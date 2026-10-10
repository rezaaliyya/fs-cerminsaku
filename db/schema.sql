-- Skema database CerminSaku (PostgreSQL).

CREATE TABLE IF NOT EXISTS users (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(255) NOT NULL,
  email          VARCHAR(255) NOT NULL UNIQUE,
  password       TEXT NOT NULL,
  phone          VARCHAR(30),
  otp            VARCHAR(10),
  otp_expired_at TIMESTAMPTZ,
  is_verified    BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Jika tabel users sudah ada dari versi lama, pastikan kolom ini tersedia
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expired_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS transactions (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(255) NOT NULL,
  category   VARCHAR(100),
  amount     NUMERIC(15,2) NOT NULL,
  type       VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  date       VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions (user_id);

CREATE TABLE IF NOT EXISTS dream_goals (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nama             VARCHAR(255) NOT NULL,
  emoji            VARCHAR(50),
  warna            VARCHAR(50),
  target           NUMERIC(15,2) NOT NULL,
  terkumpul        NUMERIC(15,2) DEFAULT 0,
  deadline         DATE,
  catatan          TEXT,
  tercapai         BOOLEAN DEFAULT false,
  tanggal_tercapai TIMESTAMP,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dream_goals_user ON dream_goals (user_id);
