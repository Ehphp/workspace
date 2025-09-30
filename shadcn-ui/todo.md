# Brellò Sales & Finance Cockpit - Implementation Plan

## MVP Features to Implement

### 1. Core Data Types & Store (src/types/index.ts, src/store/brello-store.ts)
- Define all TypeScript interfaces for entities
- Create Zustand store with localStorage persistence
- Pre-load sample data for 2025-Q4-AL batch

### 2. Authentication System (src/components/auth/)
- Login component with role selection
- Role-based access control (Admin/Sales/Finance/Viewer)
- Protected route wrapper

### 3. Main Layout & Navigation (src/components/layout/)
- Sidebar navigation with role-based menu items
- Header with user info and logout
- Responsive layout wrapper

### 4. Dashboard Page (src/pages/Dashboard.tsx)
- KPI cards: occupancy %, revenue vs target, margin YTD
- Go/No-Go semaphore indicator with 70% threshold
- Sales funnel visualization
- Break-even gauge chart

### 5. Pipeline Kanban (src/pages/Pipeline.tsx)
- Drag & drop board with 4 phases: Lead → Qualifica → Offerta → Chiusura
- Opportunity cards with client info and value
- Add new opportunity modal

### 6. Preventivatore (src/pages/Preventivatore.tsx)
- Interactive form for space/station selection
- Real-time margin calculation
- Price configuration with discounts
- Generate quote functionality

### 7. Lotti Calendar (src/pages/Lotti.tsx)
- Quarterly view (Q1-Q4) with batch status
- Inventory management (18 spaces + 10 stations)
- Batch creation and duplication

### 8. Costs & Cash Flow (src/pages/Cassa.tsx)
- Cost items management with categories
- Cash flow movements table
- Monthly balance chart
- Cost allocation visualization

### 9. Scenario Planner (src/pages/Scenari.tsx)
- Interactive sliders for occupancy, pricing, costs
- Base/Best/Worst case comparisons
- Sensitivity analysis charts
- Save/load scenarios

### 10. Reports (src/pages/Report.tsx)
- Performance by segment reports
- Batch analysis with filters
- Export to CSV functionality
- Client performance tracking

## Key Calculations to Implement
- Ricavo_lotto = Σ(spazi_venduti) + Σ(stazioni_vendute)
- Occupancy_% = (venduti / totali) × 100
- Margine_% = (Ricavo - Costi) / Ricavo × 100
- Break-even = €46,200 annual threshold
- Go/No-Go = occupancy >= 70% threshold

## Pre-loaded Data
- Batch 2025-Q4-AL: 6×Standard(€900), 8×Plus(€1100), 2×Premium(€1500), 2 unsold
- 7/10 stations sold at €900 each
- Expected revenue: €19,300/batch
- Annual costs: €46,200 (allocated across 3 batches)
- Target annual margin: €11,700

## File Structure
```
src/
├── components/
│   ├── auth/
│   ├── layout/
│   ├── dashboard/
│   ├── charts/
│   └── ui/ (shadcn components)
├── pages/
├── store/
├── types/
├── utils/
└── lib/
```