import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Real Postgres database (Neon), used for both local dev and production.
 * Prisma 7 requires an explicit driver adapter matched to the database —
 * see prisma/schema.prisma's datasource for the matching provider.
 */

// Next.js dev mode hot-reloads modules, which would otherwise create a new
// PrismaClient (and a new DB connection) on every edit. Stash it on the
// global object so it survives reloads. See:
// https://www.prisma.io/docs/orm/more/help-and-troubleshooting/nextjs-help
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
