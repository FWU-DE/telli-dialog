import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "./env";

const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 12,
});

export const db = drizzle({ client: pool });

export * from "./schema";
export * from "./functions";
export * from "./types";
export * from "./migrate";
