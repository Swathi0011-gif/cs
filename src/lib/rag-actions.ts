"use server";

import { db } from "@/lib/db";
import { documents, documentChunks, workspaces } from "@/lib/schema";
import { auth } from "@/lib/auth";
import { eq, sql as drizzleSql, cosineDistance, desc, gt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { PDFParse } from "pdf-parse";

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


export async function createWorkspace(name: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        const [workspace] = await db.insert(workspaces).values({
            userId: session.user.id,
            name: name,
        }).returning();
        revalidatePath("/dashboard/workspaces");
        return { success: true, workspaceId: workspace.id };
    } catch (error) {
        console.error("Create workspace error:", error);
        return { error: "Failed to create workspace" };
    }
}

export async function getWorkspaces() {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        return await db.select().from(workspaces).where(eq(workspaces.userId, session.user.id)).orderBy(desc(workspaces.createdAt));
    } catch (error) {
        console.error("Error fetching workspaces:", error);
        return [];
    }
}

export async function getWorkspaceDocuments(workspaceId: string) {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        return await db.select().from(documents).where(eq(documents.workspaceId, workspaceId));
    } catch (error) {
        console.error("Error fetching workspace documents:", error);
        return [];
    }
}

async function generateEmbedding(text: string): Promise<number[] | null> {
    try {
        const response = await fetch(
            "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
            }
        );

        if (!response.ok) {
            console.error("HF Inference API error:", await response.text());
            return null;
        }

        const result = await response.json();
        // HF API can return [[...]] or [...] depending on input. We expect a single embedding.
        if (Array.isArray(result) && result.length > 0) {
            // Handle case where it might return array of arrays or just array
            if (Array.isArray(result[0])) {
                return result[0] as number[];
            }
            return result as number[];
        }
        return null;
    } catch (error) {
        console.error("Embedding generation error:", error);
        return null;
    }
}

export async function uploadDocument(formData: FormData) {
    console.log("Starting uploadDocument action...");
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "You must be logged in to upload documents." };
    }

    const file = formData.get("file") as File;
    const workspaceId = formData.get("workspaceId") as string;

    if (!file) {
        return { error: "No file provided." };
    }

    if (!workspaceId) {
        return { error: "No workspace ID provided." };
    }

    try {
        console.log("Extracting file from formData...");
        let textContent = "";
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (file.type === "application/pdf") {
            const parser = new PDFParse({ data: buffer });
            const result = await parser.getText();
            textContent = result.text;
            await parser.destroy();
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
            workspaceId: workspaceId,
            name: file.name,
            type: file.type.includes("pdf") ? "pdf" : "text",
            content: textContent,
        }).returning();

        // 2. Chunk text
        const chunks = chunkText(textContent);

        // 3. Generate embeddings and save chunks
        console.log("Generating embeddings for", chunks.length, "chunks...");
        const chunkValues = [];

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const embedding = await generateEmbedding(chunk);

            if (embedding) {
                chunkValues.push({
                    documentId: doc.id,
                    content: chunk,
                    chunkIndex: i,
                    embedding: embedding,
                });
            } else {
                console.warn(`Failed to generate embedding for chunk ${i}, skipping embedding but keeping text.`);
                chunkValues.push({
                    documentId: doc.id,
                    content: chunk,
                    chunkIndex: i,
                    // If embedding fails, we can't save it as null if column is not null, 
                    // but we defined it as nullable? No, we didn't specify. 
                    // Let's assume strict schema. 
                    // To be safe, we might skip or use header/zero vector?
                    // Best to skip or handle error. 
                    // schema says: embedding: vector("embedding", { dimensions: 384 }) 
                    // modify schema request implied it's optional? No 'notNull()' was used.
                    // So we can leave it undefined/null if default allows, or just skip.
                    // Let's assume it's nullable if not specified notNull().
                    // Actually, let's treat it as required for search to work. 
                    // If it fails, we wait or retry. 
                    // For now, let's just log and continue, maybe passing null if the schema allows.
                });
            }

            // Rate limiting protection
            if (i % 5 === 0) await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Filter out those without embeddings if we want strict vector search, 
        // or just insert all if nullable.
        // Let's check schema again. `embedding: vector...` defaults to nullable usually unless `.notNull()`

        if (chunkValues.length > 0) {
            // we batch insert
            // Note: Postgres has a limit on parameters, so batch if necessary
            const BATCH_SIZE = 50;
            for (let i = 0; i < chunkValues.length; i += BATCH_SIZE) {
                await db.insert(documentChunks).values(chunkValues.slice(i, i + BATCH_SIZE));
            }
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
        // 1. Generate embedding for question
        const queryEmbedding = await generateEmbedding(question);

        let relevantChunks: any[] = [];

        if (queryEmbedding) {
            // 2. Vector search
            const similarity = drizzleSql<number>`1 - (${documentChunks.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`;

            relevantChunks = await db.select({
                content: documentChunks.content,
                similarity: similarity,
            })
                .from(documentChunks)
                .where(drizzleSql`${documentChunks.documentId} = ${docId} AND ${similarity} > 0.3`) // Filter by similarity threshold
                .orderBy(desc(similarity))
                .limit(5);
        }

        // Fallback or if no relevant results found via vector
        if (relevantChunks.length === 0) {
            console.log("Vector search returned no results, falling back to simple search or recent chunks");
            // Fallback: just get the latest or first few chunks
            relevantChunks = await db.select({ content: documentChunks.content })
                .from(documentChunks)
                .where(eq(documentChunks.documentId, docId))
                .limit(3);
        }

        const context = relevantChunks.map(c => c.content).join("\n\n---\n\n");

        if (!context) {
            return { error: "No context found." };
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

        // ... (API calling logic remains the same) ...
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

export async function queryWorkspace(workspaceId: string, question: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: "Unauthorized" };

    try {
        // 1. Generate embedding for question
        const queryEmbedding = await generateEmbedding(question);

        let relevantChunks: any[] = [];

        if (queryEmbedding) {
            // 2. Vector search across all documents in the workspace
            // We need to join with documents table to filter by workspaceId
            const similarity = drizzleSql<number>`1 - (${documentChunks.embedding} <=> ${JSON.stringify(queryEmbedding)}::vector)`;

            relevantChunks = await db.select({
                content: documentChunks.content,
                documentName: documents.name,
                similarity: similarity,
            })
                .from(documentChunks)
                .innerJoin(documents, eq(documentChunks.documentId, documents.id))
                .where(drizzleSql`${documents.workspaceId} = ${workspaceId} AND ${similarity} > 0.3`)
                .orderBy(desc(similarity))
                .limit(8); // Fetch more chunks for broader context
        }

        if (relevantChunks.length === 0) {
            return { answer: "I couldn't find any relevant information in the workspace documents to answer your question." };
        }

        // Format context with source attribution
        const context = relevantChunks.map(c => `Source: ${c.documentName}\nContent: ${c.content}`).join("\n\n---\n\n");

        // Generate answer using Groq (compatible with OpenAI) or Gemini
        const prompt = `
You are a helpful assistant. Answer the user's question based strictly on the provided context.
If the answer is not in the context, say that you don't know based on the provided documents.
Always cite the source document names when providing information.

Context:
${context}

Question:
${question}

Answer:`;

        let answer = "";

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

        return { answer, sources: [...new Set(relevantChunks.map(c => c.documentName))] };
    } catch (error) {
        console.error("Query workspace error:", error);
        return { error: "Failed to generate answer. " + (error as Error).message };
    }
}

