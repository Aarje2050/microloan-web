# MicroLoan Manager - Setup Guide

## Quick Start

1. **Clone and Install**
   ```bash
   git clone <repo-url>
   cd microloan-web
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.local.example .env.local
   # Add your Supabase credentials
   ```

3. **Database Setup**
   - Create Supabase project
   - Run database schema
   - Update super admin email

4. **Start Development**
   ```bash
   npm run dev
   ```

## Directory Structure

See `ARCHITECTURE.md` for detailed information about the project structure.

## Team Guidelines

- Follow the established directory structure
- Use TypeScript for all new code
- Add barrel exports for new modules
- Write tests for business logic
- Document complex functions

## Adding New Features

1. Create feature folder in `src/components/features/`
2. Add API layer in `src/lib/api/`
3. Create types in `src/lib/types/`
4. Add routes following group patterns
5. Update navigation and permissions
