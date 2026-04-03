# Mohar: Expense Tracker Project Context

## Overview
Mohar is a local-first personal finance tracker built with Tauri v2. It supports unified tracking of both Income and Expenses with real-time visual insights.

## Tech Stack
- **Framework:** [Tauri v2](https://v2.tauri.app/)
- **Frontend:** React (TypeScript) + Vite
- **Backend:** Rust + SQLite (rusqlite)
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui
- **Charts:** Recharts
- **Icons:** Lucide React

## Core Architecture
- **Unified Transactions:** Single `transactions` table handling both `income` and `expense` types.
- **Persistent Categories:** Dedicated `categories` table with dynamic management (Add/Delete) in Settings.
- **Multi-Page Navigation:** Sidebar-driven layout with Dashboard, Graph, and Settings views.
- **State Management:** React `useState` and `useMemo` for filtering and data processing.
- **Security (Tauri v2):** Granular permissions defined in `src-tauri/permissions/mohar-app-commands.json`.

## Features Implemented
- [x] SQLite CRUD for Transactions and Categories.
- [x] Global Dark/Light mode with persistence.
- [x] Dashboard with Income/Expense/Balance summaries.
- [x] Filtering system (Type, Category, Date Range).
- [x] Graph page with Area Chart (trends) and Pie Chart (distribution).
- [x] Category management in Settings.

## Database Schema
### `transactions`
- `id`: INTEGER PRIMARY KEY
- `title`: TEXT
- `amount`: REAL
- `category`: TEXT
- `date`: TEXT (ISO format)
- `type`: TEXT ("income" | "expense")

### `categories`
- `id`: INTEGER PRIMARY KEY
- `name`: TEXT UNIQUE
