# 🚛 TransitOps

TransitOps is a transport operations platform built as a monorepo for the Odoo Hackathon. The project combines a Node.js + Express backend, a React + Vite frontend, and a Prisma-backed data model for managing vehicles, drivers, trips, maintenance, expenses, and reporting.

![Project Status](https://img.shields.io/badge/status-in%20development-yellow.svg)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Express%20%2B%20Prisma-blue.svg)

## Overview

TransitOps is designed to centralize the core workflows of a fleet operation:

- vehicle registration and tracking
- driver management and license information
- trip creation and dispatch lifecycle
- maintenance logging
- fuel and expense tracking
- basic reporting and cost summaries

The current repository contains the initial application foundation and the main backend modules needed for these workflows.

## What is included

### Backend

The backend is a modular Express application with the following areas:

- authentication and user management
- vehicle CRUD and status updates
- driver management
- trip creation, dispatch, completion, and cancellation
- maintenance records
- fuel and expense logging
- dashboard and reporting services

The API is organized under the backend source tree and uses Prisma with a MySQL-compatible datasource.

### Frontend

The frontend is a Vite + React application that provides the client shell for the platform.

## Tech stack

- Frontend: React, Vite, TypeScript
- Backend: Node.js, Express, TypeScript
- Database: MySQL via Prisma ORM
- Auth: JWT-based authentication with role-aware route protection
- Tooling: ESLint, TypeScript, Docker support

## Project structure

- backend/: API server, Prisma schema, business modules, and shared utilities
- frontend/: React application entry point and UI shell
- infra/: Docker Compose configuration
- docs/: project documentation and operational notes

## Core data model

The application uses Prisma models for:

- users and roles
- vehicles with status and operational metadata
- drivers with license and safety information
- trips with draft/dispatched/completed/cancelled states
- maintenance logs
- fuel logs and expenses
- audit logs

## Getting started

1. Install dependencies from the repository root:
   ```bash
   npm install
   ```

2. Set up the backend environment variables for Prisma and the API.

3. Generate Prisma client and apply migrations:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. Seed the database if needed:
   ```bash
   npm run db:seed
   ```

5. Start the development environment:
   ```bash
   npm run dev
   ```

## Current status

This repository currently provides the foundational structure for a transport operations system, including the main backend modules and the Prisma-backed data model. The frontend is still in its initial scaffold stage, while the backend contains the core domain modules for the platform.

## Contributing

Contributions should be made through feature branches and reviewed before merging into the main branch.

