# Housewhere Setup Guide

## Quick Start

### 1. Database Setup (Required)

**Option A: Use Neon (Recommended - Free Tier Available)**

1. Go to [https://console.neon.tech/](https://console.neon.tech/)
2. Sign up or log in
3. Create a new project (or use existing one)
4. Go to your project dashboard
5. Click on "Connection Details"
6. Copy the connection string (it will look like: `postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`)
7. Open `/home/user/Housewhere/.env`
8. Replace `DATABASE_URL=your_database_url_here` with your actual connection string

**Option B: Use Local PostgreSQL**

1. Install PostgreSQL on your machine
2. Create a database: `createdb housewhere`
3. Update `.env` with: `DATABASE_URL=postgresql://username:password@localhost:5432/housewhere`

### 2. Install Dependencies

```bash
cd /home/user/Housewhere
npm install
```

### 3. Initialize Database Schema

```bash
npm run db:push
```

This will create all the necessary tables in your database.

### 4. Start the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### 5. Verify Database Connection

After starting the server, you should see:
```
serving on port 3000
```

If you see database errors, check that your `DATABASE_URL` in `.env` is correct.

---

## Troubleshooting

### Error: "DATABASE_URL is still set to placeholder value"

**Fix:** You need to update your `.env` file with your actual Neon database URL.
1. Get your database URL from Neon console
2. Update `.env` file: `DATABASE_URL=postgresql://your-actual-connection-string`
3. Restart the server

### Error: "cross-env: not found"

**Fix:** Dependencies not installed.
```bash
npm install
```

### Data Not Persisting After Restart

**Fix:** This usually means the database isn't connected properly.
1. Check your `.env` file has the correct `DATABASE_URL`
2. Run `npm run db:push` to ensure schema is created
3. Check server logs for database errors

### Can't Connect to Database

**Fix:**
- If using Neon: Check your connection string includes `?sslmode=require`
- If using local PostgreSQL: Ensure PostgreSQL is running
- Test connection: `psql $DATABASE_URL -c "SELECT 1;"`

---

## Environment Variables

Your `.env` file should contain:

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
PORT=3000
NODE_ENV=development
```

---

## Database Schema

The app uses PostgreSQL with Drizzle ORM. Schema is defined in `/shared/schema.ts`:

- **storage_areas**: Hierarchical storage locations (Area → Room → Storage Unit → Section)
- **items**: Individual items with tags, status, and storage location
- **item_history**: Audit trail of item changes

---

## Development Commands

```bash
# Start development server with hot reload
npm run dev

# Push database schema changes
npm run db:push

# Build for production
npm run build

# Start production server
npm start
```

---

## Testing Database Connection

After setup, test your database connection:

```bash
# Check if items endpoint works
curl http://localhost:3000/api/items

# Should return: []  (empty array if no items yet)
# Not: {"message":"Failed to fetch items"}
```

If you get an error message, check server logs for details.
