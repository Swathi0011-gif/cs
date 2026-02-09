import "dotenv/config";
import { neon } from "@neondatabase/serverless";

async function testConnection() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error("DATABASE_URL is not defined in environment variables.");
        return;
    }
    console.log("Testing connection to:", url.split("@")[1]); // Log host part for safety
    try {
        const sql = neon(url);
        const result = await sql`SELECT 1 as connected`;
        console.log("Connection successful:", result);
    } catch (error) {
        console.error("Connection failed:", error);
    }
}

testConnection();
