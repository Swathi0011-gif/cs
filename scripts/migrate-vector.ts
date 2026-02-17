
import "dotenv/config";
import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Enabling vector extension...");
  try {
    // Enable vector extension
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector;`);
    console.log("Vector extension enabled.");
  } catch (e) {
    console.error("Error enabling vector extension:", e);
  }

  console.log("Adding embedding column...");
  try {
    // Add embedding column
    await db.execute(sql`ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS embedding vector(384);`);
    console.log("Column added.");
  } catch (e) {
    console.error("Error adding column:", e);
  }
  process.exit(0);
}

main();
