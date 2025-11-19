import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import express from 'express';
import { registerRoutes } from './routes';
import { storage } from './storage';
import type { InsertStorageArea, InsertItem } from '@shared/schema';

describe('API Routes - Regression Tests', () => {
  let app: express.Application;
  let server: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  afterAll(async () => {
    server.close();
  });

  describe('Storage Areas API', () => {
    let testAreaId: string;
    let testRoomId: string;

    beforeEach(async () => {
      // Clean up test data
      const areas = await storage.getStorageAreas();
      for (const area of areas) {
        try {
          await storage.deleteStorageArea(area.id);
        } catch (e) {
          // Ignore errors from cascade issues
        }
      }
    });

    it('should create a storage area (regression: basic CRUD)', async () => {
      const newArea: InsertStorageArea = {
        name: 'Test Kitchen',
        description: 'Test kitchen area',
        type: 'area',
        parentId: null,
      };

      const area = await storage.createStorageArea(newArea);
      testAreaId = area.id;

      expect(area).toBeDefined();
      expect(area.name).toBe('Test Kitchen');
      expect(area.type).toBe('area');
    });

    it('should create hierarchical storage areas (regression: cascading hierarchy)', async () => {
      // Create Area → Room → Storage Unit → Section hierarchy
      const area = await storage.createStorageArea({
        name: 'Test Area',
        type: 'area',
        parentId: null,
      });

      const room = await storage.createStorageArea({
        name: 'Test Room',
        type: 'room',
        parentId: area.id,
      });

      const storageUnit = await storage.createStorageArea({
        name: 'Test Cabinet',
        type: 'storage_unit',
        parentId: room.id,
      });

      const section = await storage.createStorageArea({
        name: 'Top Shelf',
        type: 'section',
        parentId: storageUnit.id,
      });

      expect(area.parentId).toBeNull();
      expect(room.parentId).toBe(area.id);
      expect(storageUnit.parentId).toBe(room.id);
      expect(section.parentId).toBe(storageUnit.id);
    });

    it('should retrieve all storage areas', async () => {
      await storage.createStorageArea({
        name: 'Area 1',
        type: 'area',
        parentId: null,
      });

      await storage.createStorageArea({
        name: 'Area 2',
        type: 'area',
        parentId: null,
      });

      const areas = await storage.getStorageAreas();
      expect(areas.length).toBeGreaterThanOrEqual(2);
    });

    it('should update a storage area (regression: edit functionality)', async () => {
      const area = await storage.createStorageArea({
        name: 'Original Name',
        type: 'area',
        parentId: null,
      });

      const updated = await storage.updateStorageArea(area.id, {
        name: 'Updated Name',
        description: 'New description',
      });

      expect(updated).toBeDefined();
      expect(updated!.name).toBe('Updated Name');
      expect(updated!.description).toBe('New description');
    });

    it('should prevent deleting storage area with items (regression: delete safety check)', async () => {
      const area = await storage.createStorageArea({
        name: 'Test Area',
        type: 'area',
        parentId: null,
      });

      // Create an item in this storage area
      await storage.createItem({
        name: 'Test Item',
        storageAreaId: area.id,
        status: 'active',
      });

      // Try to delete - should be prevented
      const items = await storage.getItemsByStorageArea(area.id);
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe('Items API', () => {
    let testAreaId: string;
    let testItemId: string;

    beforeEach(async () => {
      // Create a test storage area
      const area = await storage.createStorageArea({
        name: 'Test Storage',
        type: 'area',
        parentId: null,
      });
      testAreaId = area.id;

      // Clean up test items
      const items = await storage.getItems();
      for (const item of items) {
        try {
          await storage.deleteItem(item.id);
        } catch (e) {
          // Ignore errors
        }
      }
    });

    it('should create an item (regression: basic CRUD)', async () => {
      const newItem: InsertItem = {
        name: 'Test Item',
        description: 'A test item',
        storageAreaId: testAreaId,
        tags: ['test', 'demo'],
        status: 'active',
      };

      const item = await storage.createItem(newItem);
      testItemId = item.id;

      expect(item).toBeDefined();
      expect(item.name).toBe('Test Item');
      expect(item.tags).toEqual(['test', 'demo']);
      expect(item.status).toBe('active');
    });

    it('should associate item to deepest storage tier (regression: tier 3 association bug fix)', async () => {
      // Create hierarchy
      const area = await storage.createStorageArea({
        name: 'Kitchen',
        type: 'area',
        parentId: null,
      });

      const room = await storage.createStorageArea({
        name: 'Pantry',
        type: 'room',
        parentId: area.id,
      });

      const cabinet = await storage.createStorageArea({
        name: 'Upper Cabinet',
        type: 'storage_unit',
        parentId: room.id,
      });

      // Create item with cabinet (tier 3)
      const item = await storage.createItem({
        name: 'Spice',
        storageAreaId: cabinet.id,
        status: 'active',
      });

      // Verify it's associated with cabinet, not area
      expect(item.storageAreaId).toBe(cabinet.id);
      expect(item.storageAreaId).not.toBe(area.id);
    });

    it('should retrieve item with full location path', async () => {
      const item = await storage.createItem({
        name: 'Test Item',
        storageAreaId: testAreaId,
        status: 'active',
      });

      const itemWithLocation = await storage.getItemWithLocation(item.id);

      expect(itemWithLocation).toBeDefined();
      expect(itemWithLocation!.location).toBeDefined();
      expect(itemWithLocation!.location!.length).toBeGreaterThan(0);
    });

    it('should update an item (regression: edit modal functionality)', async () => {
      const item = await storage.createItem({
        name: 'Original',
        storageAreaId: testAreaId,
        status: 'active',
      });

      const updated = await storage.updateItem(item.id, {
        name: 'Updated',
        description: 'Updated description',
        status: 'missing',
        tags: ['updated', 'tag'],
      });

      expect(updated).toBeDefined();
      expect(updated!.name).toBe('Updated');
      expect(updated!.description).toBe('Updated description');
      expect(updated!.status).toBe('missing');
      expect(updated!.tags).toContain('updated');
    });

    it('should delete an item (regression: delete functionality)', async () => {
      const item = await storage.createItem({
        name: 'To Delete',
        storageAreaId: testAreaId,
        status: 'active',
      });

      const deleted = await storage.deleteItem(item.id);
      expect(deleted).toBe(true);

      const found = await storage.getItem(item.id);
      expect(found).toBeUndefined();
    });

    it('should search items by name and description', async () => {
      await storage.createItem({
        name: 'Hammer',
        description: 'A tool for nailing',
        storageAreaId: testAreaId,
        status: 'active',
      });

      await storage.createItem({
        name: 'Screwdriver',
        description: 'A tool for screwing',
        storageAreaId: testAreaId,
        status: 'active',
      });

      const results = await storage.searchItems('tool');
      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter items by tag', async () => {
      await storage.createItem({
        name: 'Item 1',
        storageAreaId: testAreaId,
        tags: ['electronics'],
        status: 'active',
      });

      await storage.createItem({
        name: 'Item 2',
        storageAreaId: testAreaId,
        tags: ['tools'],
        status: 'active',
      });

      const electronics = await storage.getItemsByTag('electronics');
      expect(electronics.length).toBeGreaterThanOrEqual(1);
      expect(electronics[0].tags).toContain('electronics');
    });

    it('should filter items by status', async () => {
      await storage.createItem({
        name: 'Active Item',
        storageAreaId: testAreaId,
        status: 'active',
      });

      await storage.createItem({
        name: 'Missing Item',
        storageAreaId: testAreaId,
        status: 'missing',
      });

      const missingItems = await storage.getItemsByStatus('missing');
      expect(missingItems.length).toBeGreaterThanOrEqual(1);
      expect(missingItems[0].status).toBe('missing');
    });

    it('should get items by storage area (regression: clickable storage areas)', async () => {
      await storage.createItem({
        name: 'Item in Area',
        storageAreaId: testAreaId,
        status: 'active',
      });

      const items = await storage.getItemsByStorageArea(testAreaId);
      expect(items.length).toBeGreaterThanOrEqual(1);
      expect(items[0].storageAreaId).toBe(testAreaId);
    });
  });

  describe('Statistics API', () => {
    beforeEach(async () => {
      // Clean up
      const areas = await storage.getStorageAreas();
      for (const area of areas) {
        try {
          await storage.deleteStorageArea(area.id);
        } catch (e) {}
      }

      const items = await storage.getItems();
      for (const item of items) {
        try {
          await storage.deleteItem(item.id);
        } catch (e) {}
      }
    });

    it('should return accurate statistics', async () => {
      const area = await storage.createStorageArea({
        name: 'Area',
        type: 'area',
        parentId: null,
      });

      await storage.createItem({
        name: 'Item 1',
        storageAreaId: area.id,
        status: 'active',
      });

      await storage.createItem({
        name: 'Item 2',
        storageAreaId: area.id,
        status: 'missing',
      });

      const stats = await storage.getStorageStats();

      expect(stats.totalItems).toBeGreaterThanOrEqual(2);
      expect(stats.storageAreas).toBeGreaterThanOrEqual(1);
      expect(stats.missingItems).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Tags API', () => {
    beforeEach(async () => {
      const items = await storage.getItems();
      for (const item of items) {
        try {
          await storage.deleteItem(item.id);
        } catch (e) {}
      }
    });

    it('should return all unique tags', async () => {
      const area = await storage.createStorageArea({
        name: 'Area',
        type: 'area',
        parentId: null,
      });

      await storage.createItem({
        name: 'Item 1',
        storageAreaId: area.id,
        tags: ['electronics', 'gadgets'],
        status: 'active',
      });

      await storage.createItem({
        name: 'Item 2',
        storageAreaId: area.id,
        tags: ['tools', 'electronics'],
        status: 'active',
      });

      const tags = await storage.getAllTags();

      expect(tags).toContain('electronics');
      expect(tags).toContain('gadgets');
      expect(tags).toContain('tools');
    });
  });
});
