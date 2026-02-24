import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Database URL undefined");
}

const pool = new Pool({
  connectionString,
  max: 12,
});

export const db = drizzle({ client: pool });

export * from "./schema";
export * from "./functions";
export * from "./types";
export * from "./migrate";
