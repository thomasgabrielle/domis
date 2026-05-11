import pkg from "pg";
const { Pool } = pkg;

const dbUrl = process.env.DATABASE_URL!;
const isLocalhost = dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1");
const pool = new Pool({
  connectionString: dbUrl,
  ...(isLocalhost ? {} : { ssl: { rejectUnauthorized: false } }),
});

async function createSessionTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL,
      CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
    );
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
  `);
  console.log("Session table ready");
  await pool.end();
}

createSessionTable().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
