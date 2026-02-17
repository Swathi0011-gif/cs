import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Use non-null assertion carefully. In build time, this might be undefined, triggering errors.
// But neon throws if url is missing.
// We should check if we are building or if the env is present.
const connectionString = process.env.DATABASE_URL || "";

// Use a cleaner approach for serverless connection
const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
