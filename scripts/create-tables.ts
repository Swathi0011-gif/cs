
import "dotenv/config";
import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Creating tables...");

    try {
        console.log("Creating documents table...");
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS documents (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id),
        name text NOT NULL,
        type text NOT NULL,
        content text,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);
        console.log("Documents table created.");

        console.log("Creating document_chunks table...");
        // Ensure vector extension again
        await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector;`);

        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        content text NOT NULL,
        chunk_index integer NOT NULL,
        embedding vector(384)
      );
    `);
        console.log("Document chunks table created.");

    } catch (e) {
        console.error("Error creating tables:", e);
    }
    process.exit(0);
}

main();
