import { 
  type StorageArea, 
  type InsertStorageArea, 
  type Item, 
  type InsertItem,
  type ItemHistory,
  type InsertItemHistory,
  type ItemWithLocation,
  type StorageStats
} from "@shared/schema";
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

export class MemStorage implements IStorage {
  private storageAreas: Map<string, StorageArea>;
  private items: Map<string, Item>;
  private itemHistories: Map<string, ItemHistory[]>;

  constructor() {
    this.storageAreas = new Map();
    this.items = new Map();
    this.itemHistories = new Map();
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create some default storage areas
    const mainHouse: StorageArea = {
      id: "main-house",
      name: "Main House",
      description: "Primary living area",
      type: "area",
      parentId: null,
      createdAt: new Date(),
    };
    
    const garage: StorageArea = {
      id: "garage",
      name: "Garage",
      description: "Storage and workshop area",
      type: "area",
      parentId: null,
      createdAt: new Date(),
    };

    const livingRoom: StorageArea = {
      id: "living-room",
      name: "Living Room",
      description: "Main living space",
      type: "room",
      parentId: "main-house",
      createdAt: new Date(),
    };

    const kitchen: StorageArea = {
      id: "kitchen",
      name: "Kitchen",
      description: "Cooking and dining area",
      type: "room",
      parentId: "main-house",
      createdAt: new Date(),
    };

    const bedroom: StorageArea = {
      id: "bedroom",
      name: "Bedroom",
      description: "Master bedroom",
      type: "room",
      parentId: "main-house",
      createdAt: new Date(),
    };

    const closet: StorageArea = {
      id: "closet",
      name: "Closet",
      description: "Built-in wardrobe",
      type: "storage_unit",
      parentId: "bedroom",
      createdAt: new Date(),
    };

    const topShelf: StorageArea = {
      id: "top-shelf",
      name: "Top Shelf",
      description: "Upper storage section",
      type: "section",
      parentId: "closet",
      createdAt: new Date(),
    };

    [mainHouse, garage, livingRoom, kitchen, bedroom, closet, topShelf].forEach(area => {
      this.storageAreas.set(area.id, area);
    });
  }

  // Storage Areas
  async getStorageAreas(): Promise<StorageArea[]> {
    return Array.from(this.storageAreas.values());
  }

  async getStorageArea(id: string): Promise<StorageArea | undefined> {
    return this.storageAreas.get(id);
  }

  async createStorageArea(insertArea: InsertStorageArea): Promise<StorageArea> {
    const id = randomUUID();
    const area: StorageArea = {
      ...insertArea,
      id,
      createdAt: new Date(),
    };
    this.storageAreas.set(id, area);
    return area;
  }

  async updateStorageArea(id: string, updates: Partial<InsertStorageArea>): Promise<StorageArea | undefined> {
    const area = this.storageAreas.get(id);
    if (!area) return undefined;
    
    const updatedArea = { ...area, ...updates };
    this.storageAreas.set(id, updatedArea);
    return updatedArea;
  }

  async deleteStorageArea(id: string): Promise<boolean> {
    return this.storageAreas.delete(id);
  }

  async getStorageAreasByParent(parentId: string | null): Promise<StorageArea[]> {
    return Array.from(this.storageAreas.values()).filter(area => area.parentId === parentId);
  }

  // Items
  async getItems(): Promise<Item[]> {
    return Array.from(this.items.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async getItem(id: string): Promise<Item | undefined> {
    return this.items.get(id);
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const id = randomUUID();
    const now = new Date();
    const item: Item = {
      ...insertItem,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.items.set(id, item);
    
    // Create history entry
    await this.createItemHistory({
      itemId: id,
      action: "created",
      newStorageAreaId: insertItem.storageAreaId || null,
      newStatus: insertItem.status || "active",
      previousStorageAreaId: null,
      previousStatus: null,
    });
    
    return item;
  }

  async updateItem(id: string, updates: Partial<InsertItem>): Promise<Item | undefined> {
    const item = this.items.get(id);
    if (!item) return undefined;
    
    const updatedItem = { 
      ...item, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.items.set(id, updatedItem);
    
    // Create history entry for significant changes
    if (updates.storageAreaId && updates.storageAreaId !== item.storageAreaId) {
      await this.createItemHistory({
        itemId: id,
        action: "moved",
        previousStorageAreaId: item.storageAreaId || null,
        newStorageAreaId: updates.storageAreaId,
        previousStatus: item.status,
        newStatus: updatedItem.status,
      });
    }
    
    if (updates.status && updates.status !== item.status) {
      await this.createItemHistory({
        itemId: id,
        action: "status_changed",
        previousStorageAreaId: item.storageAreaId || null,
        newStorageAreaId: item.storageAreaId || null,
        previousStatus: item.status,
        newStatus: updates.status,
      });
    }
    
    return updatedItem;
  }

  async deleteItem(id: string): Promise<boolean> {
    const deleted = this.items.delete(id);
    if (deleted) {
      this.itemHistories.delete(id);
    }
    return deleted;
  }

  async getItemsByStorageArea(storageAreaId: string): Promise<Item[]> {
    return Array.from(this.items.values()).filter(item => item.storageAreaId === storageAreaId);
  }

  async searchItems(query: string): Promise<ItemWithLocation[]> {
    const lowerQuery = query.toLowerCase();
    const matchedItems = Array.from(this.items.values()).filter(item => 
      item.name.toLowerCase().includes(lowerQuery) ||
      (item.description && item.description.toLowerCase().includes(lowerQuery)) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
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
    const matchedItems = Array.from(this.items.values()).filter(item => 
      item.tags && item.tags.includes(tag)
    );
    
    const itemsWithLocation = await Promise.all(
      matchedItems.map(async item => {
        const location = await this.buildLocationPath(item.storageAreaId);
        return { ...item, location };
      })
    );
    
    return itemsWithLocation;
  }

  async getItemsByStatus(status: string): Promise<ItemWithLocation[]> {
    const matchedItems = Array.from(this.items.values()).filter(item => item.status === status);
    
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
    const id = randomUUID();
    const history: ItemHistory = {
      ...insertHistory,
      id,
      timestamp: new Date(),
    };
    
    const itemHistories = this.itemHistories.get(insertHistory.itemId) || [];
    itemHistories.push(history);
    this.itemHistories.set(insertHistory.itemId, itemHistories);
    
    return history;
  }

  async getItemHistory(itemId: string): Promise<ItemHistory[]> {
    return this.itemHistories.get(itemId) || [];
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
      const area = this.storageAreas.get(currentId);
      if (!area) break;
      
      path.unshift(area);
      currentId = area.parentId;
    }
    
    return path;
  }

  // Get all available tags
  async getAllTags(): Promise<string[]> {
    const allTags = new Set<string>();
    Array.from(this.items.values()).forEach(item => {
      if (item.tags) {
        item.tags.forEach(tag => allTags.add(tag));
      }
    });
    return Array.from(allTags).sort();
  }
}

export const storage = new MemStorage();
