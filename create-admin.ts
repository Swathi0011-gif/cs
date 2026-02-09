import { db } from "./src/lib/db";
import { users } from "./src/lib/schema";
import bcrypt from "bcryptjs";

async function createAdmin() {
    const name = "Admin User";
    const email = "admin@example.com";
    const password = "adminpassword"; // Recommended to change after login

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await db.insert(users).values({
            name,
            email,
            password: hashedPassword,
            role: "admin",
            approved: true,
        });
        console.log("Admin user created successfully!");
        console.log("Email: admin@example.com");
        console.log("Password: adminpassword");
    } catch (error) {
        console.error("Failed to create admin user:", error);
    }
}

createAdmin();
