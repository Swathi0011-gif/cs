
import "dotenv/config";
import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function main() {
    try {
        const resultDocs = await db.execute(sql`SELECT count(*) FROM documents`);
        console.log("Documents result:", resultDocs);

        const resultChunks = await db.execute(sql`SELECT count(*) FROM document_chunks`);
        console.log("Chunks count:", resultChunks[0]);
    } catch (e) {
        console.error("Error verifying tables:", e);
    }
    process.exit(0);
}

main();
