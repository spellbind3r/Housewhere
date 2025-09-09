import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const storageAreas = pgTable("storage_areas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'area', 'room', 'storage_unit', 'section'
  parentId: varchar("parent_id").references((): any => storageAreas.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const items = pgTable("items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  tags: text("tags").array().default([]),
  storageAreaId: varchar("storage_area_id").references(() => storageAreas.id),
  status: text("status").notNull().default("active"), // 'active', 'missing', 'removed'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const itemHistory = pgTable("item_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemId: varchar("item_id").references(() => items.id),
  action: text("action").notNull(), // 'created', 'moved', 'updated', 'status_changed'
  previousStorageAreaId: varchar("previous_storage_area_id").references(() => storageAreas.id),
  newStorageAreaId: varchar("new_storage_area_id").references(() => storageAreas.id),
  previousStatus: text("previous_status"),
  newStatus: text("new_status"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Insert schemas
export const insertStorageAreaSchema = createInsertSchema(storageAreas).omit({
  id: true,
  createdAt: true,
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertItemHistorySchema = createInsertSchema(itemHistory).omit({
  id: true,
  timestamp: true,
});

// Types
export type InsertStorageArea = z.infer<typeof insertStorageAreaSchema>;
export type StorageArea = typeof storageAreas.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;
export type InsertItemHistory = z.infer<typeof insertItemHistorySchema>;
export type ItemHistory = typeof itemHistory.$inferSelect;

// Enhanced types for frontend use
export type ItemWithLocation = Item & {
  location?: StorageArea[];
};

export type StorageStats = {
  totalItems: number;
  storageAreas: number;
  recentAdditions: number;
  missingItems: number;
};
