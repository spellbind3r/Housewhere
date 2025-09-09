# Overview

This is a full-stack web application for managing and tracking items in storage areas. The system provides a hierarchical organization structure where users can create nested storage areas (areas, rooms, storage units, sections) and track items within them. The application features a modern React frontend built with TypeScript and Tailwind CSS, a Node.js Express backend, and PostgreSQL database integration using Drizzle ORM.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript in SPA (Single Page Application) mode
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Build Tool**: Vite for fast development and optimized production builds

## Backend Architecture
- **Runtime**: Node.js with Express.js framework using ES modules
- **API Design**: RESTful API with JSON responses
- **Request Logging**: Custom middleware for API request/response logging with timing
- **Error Handling**: Centralized error handling with status code management
- **Development**: Hot module reloading with Vite integration for full-stack development

## Database Layer
- **Database**: PostgreSQL as the primary data store
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Migrations**: Drizzle Kit for database schema migrations and version control
- **Connection**: Neon Database serverless PostgreSQL for cloud deployment

## Data Models
- **Storage Areas**: Hierarchical structure with self-referencing parent-child relationships supporting multiple storage types (area, room, storage_unit, section)
- **Items**: Core inventory items with tagging system, status tracking (active, missing, removed), and storage area associations
- **Item History**: Complete audit trail tracking all item movements, status changes, and modifications with timestamp logging

## Authentication & Authorization
- Session-based authentication using PostgreSQL session storage with connect-pg-simple
- Cookie-based session management for stateful user sessions

## Development Environment
- **Type Safety**: Full TypeScript coverage across frontend, backend, and shared schema definitions
- **Code Organization**: Monorepo structure with shared types and schemas between client and server
- **Development Tools**: ESBuild for server bundling, TSX for TypeScript execution, and comprehensive type checking

## Styling System
- **Design System**: Custom design tokens using CSS custom properties for consistent theming
- **Component Library**: shadcn/ui providing accessible, customizable components with Radix UI primitives
- **Responsive Design**: Mobile-first responsive design with sidebar navigation and adaptive layouts
- **Icon System**: Lucide React icons for consistent visual language

# External Dependencies

## Database & Storage
- **Neon Database**: Serverless PostgreSQL database hosting
- **Drizzle ORM**: Type-safe database toolkit for PostgreSQL operations

## UI & Styling
- **Radix UI**: Headless UI component primitives for accessibility and functionality
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **shadcn/ui**: Pre-built component library built on Radix UI and Tailwind CSS

## Development & Build Tools
- **Vite**: Frontend build tool and development server
- **ESBuild**: JavaScript/TypeScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer plugins

## Runtime Dependencies
- **React Query (TanStack Query)**: Server state management and data fetching
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type validation and schema definition
- **Wouter**: Lightweight client-side routing
- **Express.js**: Web application framework for Node.js
- **date-fns**: Date utility library for consistent date formatting