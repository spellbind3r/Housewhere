import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertItemSchema, insertStorageAreaSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Storage Areas endpoints
  app.get("/api/storage-areas", async (req, res) => {
    try {
      const areas = await storage.getStorageAreas();
      res.json(areas);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch storage areas" });
    }
  });

  app.get("/api/storage-areas/:id", async (req, res) => {
    try {
      const area = await storage.getStorageArea(req.params.id);
      if (!area) {
        return res.status(404).json({ message: "Storage area not found" });
      }
      res.json(area);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch storage area" });
    }
  });

  app.post("/api/storage-areas", async (req, res) => {
    try {
      const validatedData = insertStorageAreaSchema.parse(req.body);
      const area = await storage.createStorageArea(validatedData);
      res.status(201).json(area);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create storage area" });
    }
  });

  app.put("/api/storage-areas/:id", async (req, res) => {
    try {
      const validatedData = insertStorageAreaSchema.partial().parse(req.body);
      const area = await storage.updateStorageArea(req.params.id, validatedData);
      if (!area) {
        return res.status(404).json({ message: "Storage area not found" });
      }
      res.json(area);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update storage area" });
    }
  });

  app.delete("/api/storage-areas/:id", async (req, res) => {
    try {
      // Check if storage area has items
      const items = await storage.getItemsByStorageArea(req.params.id);
      if (items.length > 0) {
        return res.status(400).json({
          message: `Cannot delete storage area: ${items.length} item(s) are stored here. Please move or delete items first.`
        });
      }

      const success = await storage.deleteStorageArea(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Storage area not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete storage area" });
    }
  });

  app.get("/api/storage-areas/parent/:parentId", async (req, res) => {
    try {
      const parentId = req.params.parentId === "null" ? null : req.params.parentId;
      const areas = await storage.getStorageAreasByParent(parentId);
      res.json(areas);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch child storage areas" });
    }
  });

  // Recent items with location endpoint (must come before /:id route)
  app.get("/api/items/recent", async (req, res) => {
    try {
      const items = await storage.getItems();
      const recentItems = items.slice(0, 10); // Get 10 most recent
      
      const itemsWithLocation = await Promise.all(
        recentItems.map(async item => {
          const itemWithLocation = await storage.getItemWithLocation(item.id);
          return itemWithLocation;
        })
      );
      
      res.json(itemsWithLocation.filter(Boolean));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent items" });
    }
  });

  // Items endpoints
  app.get("/api/items", async (req, res) => {
    try {
      const items = await storage.getItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });

  app.get("/api/items/:id", async (req, res) => {
    try {
      const item = await storage.getItemWithLocation(req.params.id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch item" });
    }
  });

  app.post("/api/items", async (req, res) => {
    try {
      const validatedData = insertItemSchema.parse(req.body);
      const item = await storage.createItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create item" });
    }
  });

  app.patch("/api/items/:id", async (req, res) => {
    try {
      const updates = insertItemSchema.partial().parse(req.body);
      const item = await storage.updateItem(req.params.id, updates);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update item" });
    }
  });

  app.delete("/api/items/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteItem(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Item not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete item" });
    }
  });

  // Search endpoints
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      const items = await storage.searchItems(query);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  app.get("/api/items/tag/:tag", async (req, res) => {
    try {
      const items = await storage.getItemsByTag(req.params.tag);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch items by tag" });
    }
  });

  app.get("/api/items/status/:status", async (req, res) => {
    try {
      const items = await storage.getItemsByStatus(req.params.status);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch items by status" });
    }
  });

  // Stats endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStorageStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Tags endpoint
  app.get("/api/tags", async (req, res) => {
    try {
      const tags = await storage.getAllTags();
      res.json(tags);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  // Item history endpoint
  app.get("/api/items/:id/history", async (req, res) => {
    try {
      const history = await storage.getItemHistory(req.params.id);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch item history" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
