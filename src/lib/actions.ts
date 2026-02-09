"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function signUp(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!name || !email || !password) {
        return { error: "Please fill in all fields" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        await db.insert(users).values({
            name,
            email,
            password: hashedPassword,
            approved: false, // Default to false for users
            role: "user",
        });
        return { success: "Account created! Pending admin approval." };
    } catch (error: any) {
        if (error.code === "23505") {
            return { error: "Email already exists" };
        }
        return { error: "Something went wrong" };
    }
}

export async function approveUser(userId: string) {
    try {
        await db.update(users).set({ approved: true }).where(eq(users.id, userId));
        revalidatePath("/admin");
        return { success: "User approved" };
    } catch (error) {
        return { error: "Failed to approve user" };
    }
}

export async function deleteUser(userId: string) {
    try {
        await db.delete(users).where(eq(users.id, userId));
        revalidatePath("/admin");
        return { success: "User deleted" };
    } catch (error) {
        return { error: "Failed to delete user" };
    }
}
