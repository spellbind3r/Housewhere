# Housewhere Testing Guide

## Overview

This project uses **Vitest** for comprehensive regression testing to ensure all features continue to work as expected.

## Test Coverage

### Backend API Tests (`server/routes.test.ts`)

#### Storage Areas CRUD
- ✅ Create storage area (basic CRUD)
- ✅ Create hierarchical storage areas (Area → Room → Storage Unit → Section)
- ✅ Retrieve all storage areas
- ✅ Update storage area (edit functionality)
- ✅ Prevent deleting storage area with items (safety check)

#### Items CRUD
- ✅ Create item (basic CRUD)
- ✅ Associate item to deepest storage tier (tier 3 bug fix)
- ✅ Retrieve item with full location path
- ✅ Update item (edit modal functionality)
- ✅ Delete item (delete functionality)
- ✅ Search items by name and description
- ✅ Filter items by tag
- ✅ Filter items by status
- ✅ Get items by storage area (clickable storage areas)

#### Statistics & Tags
- ✅ Return accurate statistics (total items, storage areas, missing items)
- ✅ Return all unique tags

## Running Tests

###Run all tests once
```bash
npm test
```

### Watch mode (re-run on file changes)
```bash
npm run test:watch
```

### Visual UI for debugging tests
```bash
npm run test:ui
```

### Run with coverage report
```bash
npm run test:coverage
```

## Test Configuration

- **Framework**: Vitest (fast, ESM-native, Vite-compatible)
- **Environment**: jsdom (for React component testing)
- **Config**: `vitest.config.ts`
- **Setup**: `test/setup.ts`

## Regression Test Scenarios

These tests validate fixes for all reported bugs:

### 1. **Modal Transparency Issue** (Fixed in earlier commits)
- Modals now use white backgrounds with dark text
- z-index layering: Dialog (z-100) > Dropdown (z-150)

### 2. **Cascading Dropdown Selection Bug**
- **Test**: "should associate item to deepest storage tier"
- **Validates**: Items save to correct tier (Cabinet, not Kitchen)
- **Scenario**: Kitchen → Pantry → Cabinet → Item should have Cabinet ID

### 3. **EditItemModal Data Loss**
- **Test**: "should update an item"
- **Validates**: Edit modal populates with existing data
- **Scenario**: Edit item should show name, description, tags, status, location

### 4. **Delete Safety for Storage Areas**
- **Test**: "should prevent deleting storage area with items"
- **Validates**: Can't delete storage area if items are stored there
- **Scenario**: Create area → Add item → Try delete area → Should fail

### 5. **Clickable Storage Areas**
- **Test**: "should get items by storage area"
- **Validates**: API endpoint exists to fetch items by storage area
- **Scenario**: Click storage area → See all items in that location

### 6. **Search Functionality**
- **Test**: "should search items by name and description"
- **Validates**: Search returns matching items
- **Scenario**: Search "tool" → Returns "Hammer" and "Screwdriver"

### 7. **Hierarchical Storage**
- **Test**: "should create hierarchical storage areas"
- **Validates**: 4-tier hierarchy works correctly
- **Scenario**: Area → Room → Storage Unit → Section parent relationships

## Adding New Tests

When adding a new feature, add tests to cover:

1. **Happy path**: Feature works as expected
2. **Error cases**: Handles invalid input gracefully
3. **Edge cases**: Empty data, null values, long strings
4. **Regression**: Bug doesn't reappear

### Example Test Structure

```typescript
describe('New Feature', () => {
  beforeEach(async () => {
    // Setup test data
  });

  it('should work correctly (happy path)', async () => {
    // Test the normal case
    expect(result).toBe(expected);
  });

  it('should handle errors gracefully', async () => {
    // Test error scenarios
    await expect(async () => {
      await functionThatShouldFail();
    }).rejects.toThrow();
  });
});
```

## CI/CD Integration

To add tests to CI/CD pipeline, run tests before deployment:

```bash
# In CI/CD script
npm install
npm run test
npm run build
```

## Troubleshooting

### Tests fail with "DATABASE_URL must be set"
- Create `.env.test` with test database URL
- Or use in-memory SQLite for tests

### Tests timeout
- Increase timeout in test: `it('test', { timeout: 10000 }, async () => {})`
- Check for async operations not being awaited

### Import errors
- Check path aliases in `vitest.config.ts`
- Ensure `@` → `./client/src` and `@shared` → `./shared`

## Future Test Coverage

Planned additions:
- Frontend component tests (modals, forms, buttons)
- Integration tests (full user flows)
- E2E tests with Playwright
- Performance tests (load testing)
- Database migration tests

---

**Remember**: Run tests before committing changes to catch regressions early!

```bash
npm test  # Quick sanity check
git commit -m "Your changes"
```
