import { Injectable, signal, computed } from '@angular/core';

export interface Label { id: string; name: string; color: string }

export interface ChecklistItem { id: string; text: string; done: boolean }

export interface Card {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  labels: Label[];
  checklist: ChecklistItem[];
  dueDate: string | null;
  assignee: string;
}

export interface Column {
  id: string;
  title: string;
  cards: Card[];
  order: number;
}

const defaultLabels: Label[] = [
  { id: 'l1', name: 'Feature', color: '#3b82f6' },
  { id: 'l2', name: 'Bug', color: '#ef4444' },
  { id: 'l3', name: 'Improvement', color: '#10b981' },
  { id: 'l4', name: 'Documentation', color: '#8b5cf6' },
  { id: 'l5', name: 'Urgent', color: '#f59e0b' },
];

const defaultCards: Card[] = [
  { id: 'c1', title: 'Research dependencies', description: 'Research and compare available dependency injection frameworks for Angular.', priority: 'high', labels: [defaultLabels[0]], checklist: [{ id: 'ci1', text: 'List options', done: true }, { id: 'ci2', text: 'Compare pros/cons', done: true }], dueDate: '2025-07-15', assignee: 'Alice' },
  { id: 'c2', title: 'Set up CI pipeline', description: 'Configure GitHub Actions for automated testing and deployment.', priority: 'medium', labels: [defaultLabels[0]], checklist: [{ id: 'ci3', text: 'Create workflow file', done: true }], dueDate: '2025-07-20', assignee: 'Bob' },
  { id: 'c3', title: 'Write unit tests', description: 'Add unit tests for core services and components.', priority: 'medium', labels: [defaultLabels[1]], checklist: [], dueDate: '2025-07-25', assignee: 'Charlie' },
  { id: 'c4', title: 'Update README', description: 'Document setup instructions and contribution guidelines.', priority: 'low', labels: [defaultLabels[3]], checklist: [], dueDate: null, assignee: '' },
  { id: 'c5', title: 'Fix navigation bug', description: 'Mobile menu doesn\'t close after selecting an item.', priority: 'urgent', labels: [defaultLabels[1], defaultLabels[4]], checklist: [{ id: 'ci4', text: 'Reproduce issue', done: true }, { id: 'ci5', text: 'Fix close logic', done: false }], dueDate: '2025-07-10', assignee: 'Alice' },
  { id: 'c6', title: 'Performance audit', description: 'Run Lighthouse and optimize bundle size.', priority: 'high', labels: [defaultLabels[2]], checklist: [{ id: 'ci6', text: 'Run Lighthouse', done: true }, { id: 'ci7', text: 'Tree shake unused modules', done: false }, { id: 'ci8', text: 'Lazy load routes', done: false }], dueDate: '2025-07-18', assignee: 'Bob' },
  { id: 'c7', title: 'Deploy to staging', description: 'Set up staging environment and deploy latest build.', priority: 'medium', labels: [defaultLabels[0]], checklist: [{ id: 'ci9', text: 'Configure staging env', done: true }], dueDate: '2025-07-22', assignee: 'Charlie' },
];

const defaultColumns: Column[] = [
  { id: 'col1', title: 'To Do', cards: [defaultCards[0], defaultCards[1], defaultCards[3]], order: 0 },
  { id: 'col2', title: 'In Progress', cards: [defaultCards[2], defaultCards[5]], order: 1 },
  { id: 'col3', title: 'Review', cards: [defaultCards[4]], order: 2 },
  { id: 'col4', title: 'Done', cards: [defaultCards[6]], order: 3 },
];

let nextId = 100;
const genId = (): string => `card-${nextId++}`;

@Injectable({ providedIn: 'root' })
export class BoardService {
  private columnsSignal = signal<Column[]>(this.loadFromStorage() ?? this.clone(defaultColumns));

  columns = computed(() => this.columnsSignal().sort((a, b) => a.order - b.order));

  private save(): void { this.columnsSignal.update(c => c); localStorage.setItem('kanban-board', JSON.stringify(this.columnsSignal())); }
  private loadFromStorage(): Column[] | null {
    try { const raw = localStorage.getItem('kanban-board'); return raw ? JSON.parse(raw) : null; } catch { return null; }
  }

  addColumn(title: string): void {
    const col: Column = { id: `col-${Date.now()}`, title, cards: [], order: this.columns().length };
    this.columnsSignal.update(cols => [...cols, col]);
    this.save();
  }

  removeColumn(colId: string): void {
    this.columnsSignal.update(cols => cols.filter(c => c.id !== colId).map((c, i) => ({ ...c, order: i })));
    this.save();
  }

  moveColumnUp(colId: string): void {
    const cols = this.columns();
    const idx = cols.findIndex(c => c.id === colId);
    if (idx <= 0) return;
    const updated = [...cols];
    [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
    this.columnsSignal.set(updated.map((c, i) => ({ ...c, order: i })));
    this.save();
  }

  moveColumnDown(colId: string): void {
    const cols = this.columns();
    const idx = cols.findIndex(c => c.id === colId);
    if (idx < 0 || idx >= cols.length - 1) return;
    const updated = [...cols];
    [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
    this.columnsSignal.set(updated.map((c, i) => ({ ...c, order: i })));
    this.save();
  }

  addCard(colId: string): void {
    const newCard: Card = { id: genId(), title: 'New Card', description: '', priority: 'medium', labels: [], checklist: [], dueDate: null, assignee: '' };
    this.columnsSignal.update(cols => cols.map(c => c.id === colId ? { ...c, cards: [newCard, ...c.cards] } : c));
    this.save();
  }

  deleteCard(colId: string, cardId: string): void {
    this.columnsSignal.update(cols => cols.map(c => c.id === colId ? { ...c, cards: c.cards.filter(card => card.id !== cardId) } : c));
    this.save();
  }

  updateCard(colId: string, cardId: string, updates: Partial<Card>): void {
    this.columnsSignal.update(cols => cols.map(c => c.id === colId ? { ...c, cards: c.cards.map(card => card.id === cardId ? { ...card, ...updates } : card) } : c));
    this.save();
  }

  moveCard(fromColId: string, toColId: string, cardId: string): void {
    if (fromColId === toColId) return;
    let card: Card | undefined;
    const withoutCard = this.columnsSignal().map(c => {
      if (c.id === fromColId) {
        const found = c.cards.find(card => card.id === cardId);
        if (found) card = found;
        return { ...c, cards: c.cards.filter(card => card.id !== cardId) };
      }
      return c;
    });

    if (!card) return;

    const targetCol = withoutCard.find(c => c.id === toColId);
    if (!targetCol) return;

    this.columnsSignal.set(withoutCard.map(c => {
      if (c.id === toColId) return { ...c, cards: [...c.cards, card!] };
      return c;
    }));
    this.save();
  }

  resetBoard(): void { localStorage.removeItem('kanban-board'); this.columnsSignal.set(this.clone(defaultColumns)); }

  private clone<T>(obj: T): T { return JSON.parse(JSON.stringify(obj)); }
}
