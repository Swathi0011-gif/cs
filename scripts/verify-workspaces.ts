
import "dotenv/config";
import { db } from "../src/lib/db";
import { workspaces, documents, documentChunks, users } from "../src/lib/schema";
import { sql, eq } from "drizzle-orm";
import { createWorkspace, getWorkspaces, uploadDocument, queryWorkspace } from "../src/lib/rag-actions";

// Mock auth for direct testing or bypassauth logic
// Since rag-actions use auth(), we can't easily test them directly without mocking auth() or modifying them.
// However, we can test the database operations directly to verify schema.

async function main() {
    console.log("Verifying workspace schema...");

    try {
        // 1. Create a workspace directly in DB
        const user = await db.query.users.findFirst();
        if (!user) {
            console.log("No user found to attach workspace to. Skipping.");
            return;
        }

        console.log("Found user:", user.email);

        const [ws] = await db.insert(workspaces).values({
            userId: user.id,
            name: "Test Workspace Verification",
        }).returning();

        console.log("Created workspace:", ws.id, ws.name);

        // 2. Create a document in that workspace
        const [doc] = await db.insert(documents).values({
            userId: user.id,
            workspaceId: ws.id,
            name: "test_doc.txt",
            type: "text",
            content: "This is a test document content for verification.",
        }).returning();

        console.log("Created document in workspace:", doc.id);

        // 3. Verify relationship
        const fetchedDocs = await db.select().from(documents).where(eq(documents.workspaceId, ws.id));
        console.log("Fetched docs for workspace:", fetchedDocs.length);

        if (fetchedDocs.length !== 1) {
            console.error("Verification FAILED: Expected 1 document, got", fetchedDocs.length);
        } else {
            console.log("Verification PASSED: Workspace-Document relationship works.");
        }

        // Clean up
        await db.delete(documents).where(eq(documents.id, doc.id));
        await db.delete(workspaces).where(eq(workspaces.id, ws.id));
        console.log("Cleaned up test data.");

    } catch (e) {
        console.error("Verification Error:", e);
    }
    process.exit(0);
}

main();
