# AI Tools Directory

A modern web application for discovering and managing AI tools, similar to aitoolnet.com.

## Project Overview

This is a full-stack web application that allows users to browse, search, and discover AI tools across various categories. Each tool has its own SEO-friendly URL for better search engine indexing.

## Features

- **Browse AI Tools**: View all AI tools in a beautiful card-based grid layout
- **Search**: Search for tools by name or description
- **Filter by Category**: Filter tools by categories (Content AI, Image AI, Video AI, Code AI, etc.)
- **Individual Tool Pages**: Each tool has its own dedicated page with URL like `/tools/chatgpt`
- **Admin Interface**: Add, edit, and delete tools through the admin panel
- **Database**: Connected to Neon PostgreSQL database for persistent storage
- **Dark/Light Mode**: Toggle between dark and light themes

## Tech Stack

- **Frontend**: React, TailwindCSS, Shadcn UI, Wouter (routing), TanStack Query
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM

## Database Schema

The application uses a single `ai_tools` table with the following structure:

- `id`: UUID primary key
- `slug`: Unique URL-friendly identifier
- `name`: Tool name
- `description`: Detailed description
- `shortDescription`: Brief one-line description
- `category`: Category (Content AI, Image AI, etc.)
- `pricing`: Pricing information
- `websiteUrl`: Official website URL
- `features`: Array of key features
- `tags`: Array of tags
- `badge`: Optional badge (Featured, New, Trending)
- `rating`: Optional rating (1-5)

## Environment Variables

- `NEON_DATABASE_URL` or `DATABASE_URL`: PostgreSQL connection string for Neon database

## API Routes

- `GET /api/tools` - Get all tools (supports ?search and ?category query params)
- `GET /api/tools/:slug` - Get a specific tool by slug
- `POST /api/tools` - Create a new tool
- `PATCH /api/tools/:id` - Update a tool
- `DELETE /api/tools/:id` - Delete a tool

## Pages

- `/` - Homepage with tool listing, search, and filters
- `/tools/:slug` - Individual tool detail page (SEO-friendly)
- `/admin` - Admin panel for managing tools

## Recent Changes

- **2025-01-04**: Initial setup with Neon database integration
- **2025-01-04**: Created database schema for AI tools
- **2025-01-04**: Implemented backend API routes
- **2025-01-04**: Built frontend with React Query integration
- **2025-01-04**: Created admin interface for CRUD operations
- **2025-01-04**: Added individual tool pages with SEO-friendly URLs

## Publishing

To publish this app to make it live:
1. Click the "Publish" button at the top of your Replit workspace
2. Replit will automatically deploy your app with autoscale deployment
3. You'll get a public URL like `yourapp.replit.app`
