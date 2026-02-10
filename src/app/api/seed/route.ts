import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function GET() {
    // This is a one-time setup endpoint. 
    // In production, you would remove this or protect it with a secret key.

    const name = "Admin User";
    const email = "admin@example.com";
    const password = "adminpassword";

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Ensure table exists (as a fallback)
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user',
            approved BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
          );
        `);

        await db.insert(users).values({
            name,
            email,
            password: hashedPassword,
            role: "admin",
            approved: true,
        }).onConflictDoUpdate({
            target: users.email,
            set: {
                password: hashedPassword,
                approved: true,
                role: "admin"
            }
        });

        return NextResponse.json({
            success: true,
            message: "Admin user initialized",
            email: email,
            password: "adminpassword (please change this after login)"
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Initialization failed"
        }, { status: 500 });
    }
}
