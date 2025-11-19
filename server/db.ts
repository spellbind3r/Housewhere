import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Check if DATABASE_URL is still the placeholder value
if (process.env.DATABASE_URL === "your_database_url_here" ||
    process.env.DATABASE_URL.includes("your_database_url_here")) {
  console.error("\n❌ DATABASE ERROR: DATABASE_URL is still set to placeholder value!");
  console.error("Please update your .env file with your actual Neon database URL.");
  console.error("Get your database URL from: https://console.neon.tech/\n");
  throw new Error(
    "DATABASE_URL is not configured. Please update .env file with your actual Neon database connection string."
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });