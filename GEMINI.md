# Mohar: Expense Tracker Project Context

## Overview
Mohar is a local-first expense tracker application designed for privacy and speed.

## Tech Stack
- **Framework:** [Tauri v2](https://v2.tauri.app/)
- **Frontend:** React (TypeScript) + Vite
- **Backend:** Rust
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Database:** SQLite (handled via custom Rust commands)

## Core Mandates & Architecture
- **Tauri v2 Strictness:** Adhere to the new V2 security model, specifically managing permissions in `src-tauri/capabilities/`.
- **Backend-First Data:** All SQLite operations must reside in the Rust backend. The frontend communicates via `invoke` commands.
- **Type Safety:** Maintain strict TypeScript interfaces that mirror Rust structs for all data transferred across the bridge.
- **UI Consistency:** Use shadcn/ui components for all interface elements to ensure a modern, polished aesthetic.

## Implementation Details
- **Database File:** Store the SQLite database in the standard app data directory.
- **State Management:** (TBD based on complexity)
