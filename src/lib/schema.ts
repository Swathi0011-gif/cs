import { pgTable, text, timestamp, boolean, uuid, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "user"] }).default("user").notNull(),
  approved: boolean("approved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'pdf' or 'text'
  content: text("content"), // full content for backup
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documentChunks = pgTable("document_chunks", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id").references(() => documents.id).notNull(),
  content: text("content").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  // We'll use this for simple search if vector is not enabled
  // If we had pgvector, we'd add a vector column here
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type DocumentChunk = typeof documentChunks.$inferSelect;
