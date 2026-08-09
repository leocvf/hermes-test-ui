import { Injectable, signal, computed } from '@angular/core';

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Card {
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

export interface Column {
  id: string;
  title: string;
  cards: Card[];
  order: number;
}

export interface BoardState {
  columns: Column[];
}

const LOCAL_STORAGE_KEY = 'kanban-board-state';

const DEFAULT_LABELS: Label[] = [
  { id: 'l1', name: 'Feature', color: '#3b82f6' },
  { id: 'l2', name: 'Bug', color: '#ef4444' },
  { id: 'l3', name: 'Improvement', color: '#10b981' },
  { id: 'l4', name: 'Documentation', color: '#8b5cf6' },
  { id: 'l5', name: 'Urgent', color: '#f59e0b' },
];

function createCard(overrides: Partial<Card> = {}): Card {
  return {
    id: uuidv4(),
    title: '',
    description: '',
    labels: [],
    priority: 'medium',
    dueDate: null,
    assignee: '',
    checklist: [],
    order: 0,
    ...overrides,
  };
}

function createColumn(overrides: Partial<Column> = {}): Column {
  return { id: uuidv4(), title: '', cards: [], order: 0, ...overrides };
}

function getDefaultBoard(): BoardState {
  return {
    columns: [
      createColumn({
        title: 'To Do',
        order: 0,
        cards: [
          createCard({ title: 'Set up project structure', description: 'Initialize Angular app with routing and basic layout', labels: [{ ...DEFAULT_LABELS[0] }], priority: 'high', order: 0 }),
          createCard({ title: 'Design wireframes', description: 'Create wireframes for the kanban board UI', labels: [{ ...DEFAULT_LABELS[3] }], priority: 'medium', order: 1 }),
          createCard({ title: 'Fix login bug on Safari', description: 'Users report login form not submitting on Safari browser', labels: [{ ...DEFAULT_LABELS[1] }, { ...DEFAULT_LABELS[4] }], priority: 'urgent', order: 2 }),
        ],
      }),
      createColumn({
        title: 'In Progress',
        order: 1,
        cards: [
          createCard({ title: 'Implement drag and drop', description: 'Use native HTML5 drag and drop API for cards', labels: [{ ...DEFAULT_LABELS[0] }], priority: 'high', dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], order: 0 }),
          createCard({ title: 'Add filtering feature', description: 'Allow filtering cards by label, assignee, and date', labels: [{ ...DEFAULT_LABELS[2] }], priority: 'medium', order: 1 }),
        ],
      }),
      createColumn({
        title: 'Review',
        order: 2,
        cards: [
          createCard({ title: 'Code review: auth module', description: 'Review pull request for authentication module', labels: [{ ...DEFAULT_LABELS[3] }], priority: 'low', order: 0 }),
        ],
      }),
      createColumn({
        title: 'Done',
        order: 3,
        cards: [
          createCard({ title: 'Setup CI/CD pipeline', description: 'Configure GitHub Actions for automated testing and deployment', labels: [{ ...DEFAULT_LABELS[2] }], priority: 'high', dueDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], order: 0 }),
        ],
      }),
    ],
  };
}

function loadBoard(): BoardState | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveBoard(state: BoardState): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch { /* quota exceeded, ignore */ }
}

@Injectable({ providedIn: 'root' })
export class BoardService {
  private state = signal<BoardState>(loadBoard() ?? getDefaultBoard());

  columns = computed(() => {
    const cols = [...this.state().columns];
    cols.sort((a, b) => a.order - b.order);
    return cols;
  });

  allCards = computed(() => {
    return this.columns().flatMap(c => c.cards.map(card => ({ ...card, columnId: c.id })));
  });

  boardState = this.state;

  nextOrder(arr: unknown[]): number {
    return arr.length;
  }

  addCard(columnId: string, card?: Partial<Card>): void {
    const s = this.state();
    const col = s.columns.find(c => c.id === columnId);
    if (!col) return;
    const newCard = createCard(card ?? {});
    newCard.order = this.nextOrder(col.cards);
    col.cards.push(newCard);
    this.state.update(() => ({ ...s, columns: [...s.columns] }));
    this.persist();
  }

  updateCard(columnId: string, cardId: string, updates: Partial<Card>): void {
    const s = this.state();
    const col = s.columns.find(c => c.id === columnId);
    if (!col) return;
    const card = col.cards.find(c => c.id === cardId);
    if (!card) return;
    Object.assign(card, updates);
    this.state.update(() => ({ ...s, columns: [...s.columns] }));
    this.persist();
  }

  deleteCard(columnId: string, cardId: string): void {
    const s = this.state();
    const col = s.columns.find(c => c.id === columnId);
    if (!col) return;
    col.cards = col.cards.filter(c => c.id !== cardId);
    this.state.update(() => ({ ...s, columns: [...s.columns] }));
    this.persist();
  }

  addColumn(title: string): void {
    const s = this.state();
    const newCol = createColumn({ title, order: this.nextOrder(s.columns) });
    s.columns.push(newCol);
    this.state.update(() => ({ ...s, columns: [...s.columns] }));
    this.persist();
  }

  updateColumnTitle(columnId: string, title: string): void {
    const s = this.state();
    const col = s.columns.find(c => c.id === columnId);
    if (!col) return;
    col.title = title;
    this.state.update(() => ({ ...s, columns: [...s.columns] }));
    this.persist();
  }

  deleteColumn(columnId: string): void {
    const s = this.state();
    s.columns = s.columns.filter(c => c.id !== columnId);
    this.state.update(() => ({ ...s, columns: [...s.columns] }));
    this.persist();
  }

  moveCard(fromColumnId: string, toColumnId: string, cardId: string, toOrder?: number): void {
    const s = this.state();
    const fromCol = s.columns.find(c => c.id === fromColumnId);
    const toCol = s.columns.find(c => c.id === toColumnId);
    if (!fromCol || !toCol) return;
    const cardIdx = fromCol.cards.findIndex(c => c.id === cardId);
    if (cardIdx === -1) return;
    const [card] = fromCol.cards.splice(cardIdx, 1);
    card.order = toOrder !== undefined ? toOrder : this.nextOrder(toCol.cards);
    toCol.cards.splice(card.order, 0, card);
    this.state.update(() => ({ ...s, columns: [...s.columns] }));
    this.persist();
  }

  reorderColumns(newOrder: string[]): void {
    const s = this.state();
    const orderMap = new Map(newOrder.map((id, i) => [id, i]));
    s.columns.forEach(c => { c.order = orderMap.get(c.id) ?? 0; });
    this.state.update(() => ({ ...s, columns: [...s.columns] }));
    this.persist();
  }

  moveColumnUp(columnId: string): void {
    const s = this.state();
    const idx = s.columns.findIndex(c => c.id === columnId);
    if (idx <= 0) return;
    const a = s.columns[idx - 1];
    const b = s.columns[idx];
    const tmp = a.order;
    a.order = b.order;
    b.order = tmp;
    this.state.update(() => ({ ...s, columns: [...s.columns] }));
    this.persist();
  }

  moveColumnDown(columnId: string): void {
    const s = this.state();
    const idx = s.columns.findIndex(c => c.id === columnId);
    if (idx < 0 || idx >= s.columns.length - 1) return;
    const a = s.columns[idx];
    const b = s.columns[idx + 1];
    const tmp = a.order;
    a.order = b.order;
    b.order = tmp;
    this.state.update(() => ({ ...s, columns: [...s.columns] }));
    this.persist();
  }

  resetBoard(): void {
    const def = getDefaultBoard();
    this.state.update(() => def);
    this.persist();
  }

  private persist(): void {
    saveBoard(this.state());
  }
}
