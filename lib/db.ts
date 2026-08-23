import { PrismaClient } from "./generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

/**
 * ── SWITCHING TO A REAL DATABASE FOR PRODUCTION ──
 * Prisma 7 requires an explicit "driver adapter" matched to your database,
 * not just a connection string. This file is wired for local SQLite via
 * better-sqlite3. To move to Postgres (Vercel Postgres, Supabase, Neon,
 * etc.) for production:
 *   1. npm install @prisma/adapter-pg pg
 *   2. Change `provider = "sqlite"` to `provider = "postgresql"` in
 *      prisma/schema.prisma, then run `npx prisma migrate dev` once
 *      locally against the new DB to regenerate migrations for it.
 *   3. Replace the adapter below with:
 *        import { PrismaPg } from "@prisma/adapter-pg";
 *        const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
 *   4. Set DATABASE_URL in your host's environment variables to the
 *      Postgres connection string.
 */

// Next.js dev mode hot-reloads modules, which would otherwise create a new
// PrismaClient (and a new DB connection) on every edit. Stash it on the
// global object so it survives reloads. See:
// https://www.prisma.io/docs/orm/more/help-and-troubleshooting/nextjs-help
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
