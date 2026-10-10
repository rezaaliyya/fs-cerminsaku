import pg from "pg";

const { Pool, types } = pg;

// numeric -> angka JS (bawaan pg mengembalikan string)
types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v)));
// date -> "YYYY-MM-DD" apa adanya (hindari geser tanggal karena zona waktu)
types.setTypeParser(1082, (v) => v);

function buildConfig() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return { connectionString: undefined };

  const isLocal = /@(localhost|127\.0\.0\.1)/.test(raw);
  let connectionString = raw;
  try {
    const u = new URL(raw);
    u.searchParams.delete("sslmode");
    connectionString = u.toString();
  } catch {
    /* pakai apa adanya */
  }

  return {
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    // Serverless: koneksi sedikit & cepat dilepas
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  };
}

// Pool dipakai ulang antar-invocation selama instance fungsi masih hidup.
export const pool = globalThis.__cerminsakuPool ?? (globalThis.__cerminsakuPool = new Pool(buildConfig()));

export default pool;
