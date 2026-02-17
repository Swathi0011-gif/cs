
import "dotenv/config";
import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Starting workspace migration...");

    try {
        // 1. Create workspaces table
        console.log("Creating workspaces table...");
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS workspaces (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id),
        name text NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL
      );
    `);
        console.log("Workspaces table created.");

        // 2. Add workspace_id column to documents
        console.log("Adding workspace_id to documents...");
        // Check if column exists first to avoid error
        // In postgres, adding a column is idempotent if we handle errors or check info_schema, 
        // but IF NOT EXISTS is only for tables/extensions usually in simple SQL. 
        // ALTER TABLE ... ADD COLUMN IF NOT EXISTS is supported in modern Postgres (9.6+). Neon supports it.
        await db.execute(sql`
      ALTER TABLE documents 
      ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id);
    `);
        console.log("workspace_id column added to documents.");

    } catch (e) {
        console.error("Error during migration:", e);
    }
    process.exit(0);
}

main();
