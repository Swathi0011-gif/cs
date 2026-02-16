"use server";

import { db } from "@/lib/db";
import { documents, documentChunks } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { eq, sql as drizzleSql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import pdf from "pdf-parse/lib/pdf-parse.js";

// Simple chunking function using sentence/paragraph breaks
function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
        let end = start + chunkSize;

        // Try to find a good breaking point (newline or period)
        if (end < text.length) {
            const nextNewline = text.indexOf('\n', end - 100);
            if (nextNewline !== -1 && nextNewline < end + 100) {
                end = nextNewline + 1;
            } else {
                const nextPeriod = text.indexOf('. ', end - 100);
                if (nextPeriod !== -1 && nextPeriod < end + 100) {
                    end = nextPeriod + 2;
                }
            }
        }

        chunks.push(text.slice(start, end).trim());
        start = end - overlap;
        if (start < 0) start = 0;
        if (start >= text.length - overlap && chunks.length > 1) break;
    }

    return chunks.filter(c => c.length > 50); // Filter out very small chunks
}

export async function uploadDocument(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "You must be logged in to upload documents." };
    }

    const file = formData.get("file") as File;
    if (!file) {
        return { error: "No file provided." };
    }

    try {
        let textContent = "";
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (file.type === "application/pdf") {
            const data = await pdf(buffer);
            textContent = data.text;
        } else if (file.type === "text/plain") {
            textContent = buffer.toString("utf-8");
        } else {
            return { error: "Unsupported file type. Please upload PDF or Text files." };
        }

        if (!textContent || textContent.trim().length === 0) {
            return { error: "Could not extract text from the file." };
        }

        // 1. Create document record
        const [doc] = await db.insert(documents).values({
            userId: session.user.id,
            name: file.name,
            type: file.type.includes("pdf") ? "pdf" : "text",
            content: textContent,
        }).returning();

        // 2. Chunk text and save chunks
        const chunks = chunkText(textContent);
        const chunkValues = chunks.map((chunk, index) => ({
            documentId: doc.id,
            content: chunk,
            chunkIndex: index,
        }));

        if (chunkValues.length > 0) {
            await db.insert(documentChunks).values(chunkValues);
        }

        revalidatePath("/dashboard/documents");
        return { success: "Document uploaded and processed successfully.", documentId: doc.id };
    } catch (error) {
        console.error("Upload error:", error);
        return { error: "Failed to process document. " + (error as Error).message };
    }
}

export async function getDocuments() {
    const session = await auth();
    if (!session?.user?.id) return [];

    return await db.select().from(documents).where(eq(documents.userId, session.user.id));
}

export async function deleteDocument(docId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        await db.delete(documentChunks).where(eq(documentChunks.documentId, docId));
        await db.delete(documents).where(eq(documents.id, docId));
        revalidatePath("/dashboard/documents");
        return { success: "Document deleted" };
    } catch {
        return { error: "Failed to delete document" };
    }
}

export async function queryDocument(docId: string, question: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        // Simple context retrieval: In a real app, we'd use vector similarity.
        // For this task, we'll use a basic keyword search or just the most relevant chunks.
        // Since we don't have pgvector, let's just get chunks that contain words from the question
        // or just the first few chunks as a baseline if no vector possible.

        // Improved simple search: look for chunks containing words from the question
        const keywords = question.toLowerCase().split(/\W+/).filter(w => w.length > 3);

        let relevantChunks: any[] = [];

        if (keywords.length > 0) {
            // Fuzzy match search in Postgres
            const conditions = keywords.map(kw => drizzleSql`${documentChunks.content} ILIKE ${'%' + kw + '%'}`);
            relevantChunks = await db.select()
                .from(documentChunks)
                .where(drizzleSql`${documentChunks.documentId} = ${docId} AND (${drizzleSql.join(conditions, drizzleSql` OR `)})`)
                .limit(5);
        }

        if (relevantChunks.length === 0) {
            // Fallback to first few chunks
            relevantChunks = await db.select()
                .from(documentChunks)
                .where(eq(documentChunks.documentId, docId))
                .limit(3);
        }

        const context = relevantChunks.map(c => c.content).join("\n\n---\n\n");

        if (!context) {
            return { error: "No relevant content found in the document." };
        }

        // Generate answer using Groq (compatible with OpenAI) or Gemini
        const prompt = `
You are a helpful assistant. Answer the user's question based strictly on the provided context.
If the answer is not in the context, say that you don't know based on the document.

Context:
${context}

Question:
${question}

Answer:`;

        let answer = "";

        // Check for Groq API key, otherwise fallback to Gemini which we know is there
        const apiKey = process.env.GROQ_API_KEY || process.env.GOOGLE_AI_API_KEY;

        if (process.env.GROQ_API_KEY) {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0,
                }),
            });
            const data = await response.json();
            answer = data.choices[0].message.content;
        } else {
            // Fallback to Google Gemini
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0 },
                }),
            });
            const data = await response.json();
            answer = data.candidates[0].content.parts[0].text;
        }

        return { answer };
    } catch (error) {
        console.error("Query error:", error);
        return { error: "Failed to generate answer. " + (error as Error).message };
    }
}
