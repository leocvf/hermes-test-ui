# Kanban Board Management Plan

## Project: test-ui-app (Angular 21)

## Features

### 1. Core Board
- Multiple columns (lists) displayed horizontally
- Cards within each column with title, description, labels, priority, due date, assignee
- Drag and drop cards between columns
- Drag and drop columns to reorder

### 2. Card Management
- Create new cards (inline add button per column)
- Edit card details via modal
- Delete cards with confirmation
- Card properties: title, description, labels/tags (colored), priority, due date, assignee, checklist items

### 3. Column Management
- Add new columns
- Rename columns (inline editing)
- Delete columns (with option to move cards elsewhere)
- Reorder columns via drag and drop

### 4. Filtering & Search
- Global search by title/description
- Filter by label color
- Filter by assignee
- Filter by due date (overdue, today, upcoming)
- Filter by priority

### 5. Data Persistence
- LocalStorage for board state (columns, cards, order)
- Auto-save on every change

### 6. UI/UX
- Responsive horizontal scroll layout
- Smooth drag-and-drop with visual feedback
- Modal for card editing with all properties
- Color-coded labels and priority indicators
- Clean, modern design with CSS custom properties

## Architecture

### Components (Standalone, Angular 21)
- `app` - root, holds board state
- `board` - main container, renders columns horizontally
- `column` - single column with cards list
- `card` - single card with drag handle and preview
- `card-modal` - full card editor modal

### Services
- `board.service.ts` - all state management via signals, CRUD operations, localStorage sync

### Data Model
```typescript
interface Card {
  id: string;
  title: string;
  description: string;
  labels: Label[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string | null;
  assignee: string;
  checklist: ChecklistItem[];
  order: number;
}

interface Label {
  id: string;
  name: string;
  color: string;
}

interface Column {
  id: string;
  title: string;
  cards: Card[];
  order: number;
}

interface BoardState {
  columns: Column[];
}
```

### Pre-seeded Data
- 4 columns: To Do, In Progress, Review, Done
- ~2-3 sample cards per column with various labels, priorities, dates

## Implementation Steps

1. Create service with signals-based state management and localStorage persistence
2. Create card component with drag-and-drop support
3. Create column component with add/edit/delete and card list
4. Create board component with horizontal layout and column drag-and-drop
5. Create card modal for full card editing
6. Add search/filter bar at the top
7. Seed initial data
8. Style everything with CSS custom properties
9. Test build

## Tech Choices
- Angular 21 standalone components with signals
- Native HTML5 drag and drop API (no extra deps)
- CSS custom properties for theming
- LocalStorage for persistence
