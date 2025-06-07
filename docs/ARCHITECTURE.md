# System Architecture

## Overview

MicroLoan Manager is built with a modern, scalable architecture:

- **Frontend**: Next.js 14 with App Router
- **Backend**: Supabase (PostgreSQL + Auth)
- **State Management**: Zustand + React Query
- **Styling**: Tailwind CSS + Custom Design System
- **TypeScript**: Full type safety throughout

## Directory Structure

### `/src/app` - Next.js App Router
Routes and layouts using the new App Router pattern.

### `/src/components` - UI Components
Organized by purpose: ui (design system), forms, layout, features, common.

### `/src/lib` - Business Logic
Core application logic, API calls, utilities, and types.

## Design Principles

1. **Feature-Based Organization**: Related code grouped together
2. **Separation of Concerns**: UI, logic, and data clearly separated
3. **Reusability**: Components and utilities designed for reuse
4. **Type Safety**: TypeScript throughout for better DX
5. **Mobile-First**: Responsive design from the ground up

## Development Workflow

1. Plan feature requirements
2. Design API endpoints and types
3. Create UI components
4. Implement business logic
5. Add tests and documentation
6. Review and deploy
