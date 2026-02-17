
import "dotenv/config";
import { db } from "../src/lib/db";
import { workspaces } from "../src/lib/schema";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Checking database connection and schema...");
    try {
        // 1. Check if we can execute simple SQL
        const now = await db.execute(sql`SELECT NOW()`);
        console.log("DB Connection OK:", now[0]);

        // 2. Check if workspaces table exists
        // Note: checking via information_schema or just trying to select
        const count = await db.select({ count: sql<number>`count(*)` }).from(workspaces);
        console.log("Workspaces count:", count[0]);

        console.log("Schema check PASSED.");
    } catch (e) {
        console.error("Schema check FAILED:", e);
    }
    process.exit(0);
}

main();
