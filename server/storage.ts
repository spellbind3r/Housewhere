import { 
  type StorageArea, 
  type InsertStorageArea, 
  type Item, 
  type InsertItem,
  type ItemHistory,
  type InsertItemHistory,
  type ItemWithLocation,
  type StorageStats,
  storageAreas,
  items,
  itemHistory
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, sql, and, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Storage Areas
  getStorageAreas(): Promise<StorageArea[]>;
  getStorageArea(id: string): Promise<StorageArea | undefined>;
  createStorageArea(area: InsertStorageArea): Promise<StorageArea>;
  updateStorageArea(id: string, updates: Partial<InsertStorageArea>): Promise<StorageArea | undefined>;
  deleteStorageArea(id: string): Promise<boolean>;
  getStorageAreasByParent(parentId: string | null): Promise<StorageArea[]>;
  
  // Items
  getItems(): Promise<Item[]>;
  getItem(id: string): Promise<Item | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: string, updates: Partial<InsertItem>): Promise<Item | undefined>;
  deleteItem(id: string): Promise<boolean>;
  getItemsByStorageArea(storageAreaId: string): Promise<Item[]>;
  searchItems(query: string): Promise<ItemWithLocation[]>;
  getItemsByTag(tag: string): Promise<ItemWithLocation[]>;
  getItemsByStatus(status: string): Promise<ItemWithLocation[]>;
  
  // Item History
  createItemHistory(history: InsertItemHistory): Promise<ItemHistory>;
  getItemHistory(itemId: string): Promise<ItemHistory[]>;
  
  // Stats
  getStorageStats(): Promise<StorageStats>;
  
  // Location path building
  getItemWithLocation(itemId: string): Promise<ItemWithLocation | undefined>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    // Database tables are created via Drizzle migrations
    // No need for initialization as we query the database directly
  }

  // Storage Areas
  async getStorageAreas(): Promise<StorageArea[]> {
    return await db.select().from(storageAreas).orderBy(storageAreas.createdAt);
  }

  async getStorageArea(id: string): Promise<StorageArea | undefined> {
    const result = await db.select().from(storageAreas).where(eq(storageAreas.id, id)).limit(1);
    return result[0];
  }

  async createStorageArea(insertArea: InsertStorageArea): Promise<StorageArea> {
    const result = await db.insert(storageAreas).values(insertArea).returning();
    return result[0];
  }

  async updateStorageArea(id: string, updates: Partial<InsertStorageArea>): Promise<StorageArea | undefined> {
    const result = await db
      .update(storageAreas)
      .set(updates)
      .where(eq(storageAreas.id, id))
      .returning();
    return result[0];
  }

  async deleteStorageArea(id: string): Promise<boolean> {
    const result = await db.delete(storageAreas).where(eq(storageAreas.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getStorageAreasByParent(parentId: string | null): Promise<StorageArea[]> {
    if (parentId === null) {
      return await db.select().from(storageAreas).where(sql`parent_id IS NULL`);
    }
    return await db.select().from(storageAreas).where(eq(storageAreas.parentId, parentId));
  }

  // Items
  async getItems(): Promise<Item[]> {
    return await db.select().from(items).orderBy(sql`created_at DESC`);
  }

  async getItem(id: string): Promise<Item | undefined> {
    const result = await db.select().from(items).where(eq(items.id, id)).limit(1);
    return result[0];
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const result = await db.insert(items).values(insertItem).returning();
    const item = result[0];
    
    // Create history entry
    await this.createItemHistory({
      itemId: item.id,
      action: "created",
      newStorageAreaId: insertItem.storageAreaId || null,
      newStatus: insertItem.status || "active",
      previousStorageAreaId: null,
      previousStatus: null,
    });
    
    return item;
  }

  async updateItem(id: string, updates: Partial<InsertItem>): Promise<Item | undefined> {
    // Get the current item first
    const currentItem = await this.getItem(id);
    if (!currentItem) return undefined;
    
    // Update with current timestamp
    const updatedValues = {
      ...updates,
      updatedAt: new Date()
    };
    
    const result = await db
      .update(items)
      .set(updatedValues)
      .where(eq(items.id, id))
      .returning();
    
    const updatedItem = result[0];
    if (!updatedItem) return undefined;
    
    // Create history entry for significant changes
    if (updates.storageAreaId && updates.storageAreaId !== currentItem.storageAreaId) {
      await this.createItemHistory({
        itemId: id,
        action: "moved",
        previousStorageAreaId: currentItem.storageAreaId || null,
        newStorageAreaId: updates.storageAreaId,
        previousStatus: currentItem.status,
        newStatus: updatedItem.status,
      });
    }
    
    if (updates.status && updates.status !== currentItem.status) {
      await this.createItemHistory({
        itemId: id,
        action: "status_changed",
        previousStorageAreaId: currentItem.storageAreaId || null,
        newStorageAreaId: currentItem.storageAreaId || null,
        previousStatus: currentItem.status,
        newStatus: updates.status,
      });
    }
    
    return updatedItem;
  }

  async deleteItem(id: string): Promise<boolean> {
    // Delete associated history first
    await db.delete(itemHistory).where(eq(itemHistory.itemId, id));
    
    // Delete the item
    const result = await db.delete(items).where(eq(items.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getItemsByStorageArea(storageAreaId: string): Promise<Item[]> {
    return await db.select().from(items).where(eq(items.storageAreaId, storageAreaId));
  }

  async searchItems(query: string): Promise<ItemWithLocation[]> {
    const matchedItems = await db
      .select()
      .from(items)
      .where(
        sql`(
          ${ilike(items.name, `%${query}%`)} OR 
          ${ilike(items.description, `%${query}%`)} OR 
          EXISTS (
            SELECT 1 FROM unnest(${items.tags}) AS tag 
            WHERE tag ILIKE ${'%' + query + '%'}
          )
        )`
      );
    
    const itemsWithLocation = await Promise.all(
      matchedItems.map(async item => {
        const location = await this.buildLocationPath(item.storageAreaId);
        return { ...item, location };
      })
    );
    
    return itemsWithLocation;
  }

  async getItemsByTag(tag: string): Promise<ItemWithLocation[]> {
    const matchedItems = await db
      .select()
      .from(items)
      .where(sql`${tag} = ANY(${items.tags})`);
    
    const itemsWithLocation = await Promise.all(
      matchedItems.map(async item => {
        const location = await this.buildLocationPath(item.storageAreaId);
        return { ...item, location };
      })
    );
    
    return itemsWithLocation;
  }

  async getItemsByStatus(status: string): Promise<ItemWithLocation[]> {
    const matchedItems = await db.select().from(items).where(eq(items.status, status));
    
    const itemsWithLocation = await Promise.all(
      matchedItems.map(async item => {
        const location = await this.buildLocationPath(item.storageAreaId);
        return { ...item, location };
      })
    );
    
    return itemsWithLocation;
  }

  // Item History
  async createItemHistory(insertHistory: InsertItemHistory): Promise<ItemHistory> {
    const result = await db.insert(itemHistory).values(insertHistory).returning();
    return result[0];
  }

  async getItemHistory(itemId: string): Promise<ItemHistory[]> {
    return await db
      .select()
      .from(itemHistory)
      .where(eq(itemHistory.itemId, itemId))
      .orderBy(sql`timestamp DESC`);
  }

  // Stats
  async getStorageStats(): Promise<StorageStats> {
    const items = await this.getItems();
    const storageAreas = await this.getStorageAreas();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return {
      totalItems: items.length,
      storageAreas: storageAreas.length,
      recentAdditions: items.filter(item => 
        item.createdAt && new Date(item.createdAt) > weekAgo
      ).length,
      missingItems: items.filter(item => item.status === "missing").length,
    };
  }

  // Helper methods
  async getItemWithLocation(itemId: string): Promise<ItemWithLocation | undefined> {
    const item = await this.getItem(itemId);
    if (!item) return undefined;
    
    const location = await this.buildLocationPath(item.storageAreaId);
    return { ...item, location };
  }

  private async buildLocationPath(storageAreaId: string | null): Promise<StorageArea[]> {
    if (!storageAreaId) return [];
    
    const path: StorageArea[] = [];
    let currentId: string | null = storageAreaId;
    
    while (currentId) {
      const area = await this.getStorageArea(currentId);
      if (!area) break;
      
      path.unshift(area);
      currentId = area.parentId;
    }
    
    return path;
  }

  // Get all available tags
  async getAllTags(): Promise<string[]> {
    const result = await db
      .select({ tags: items.tags })
      .from(items)
      .where(sql`${items.tags} IS NOT NULL AND array_length(${items.tags}, 1) > 0`);
    
    const allTags = new Set<string>();
    result.forEach(row => {
      if (row.tags) {
        row.tags.forEach(tag => allTags.add(tag));
      }
    });
    
    return Array.from(allTags).sort();
  }
}

export const storage = new DatabaseStorage();
