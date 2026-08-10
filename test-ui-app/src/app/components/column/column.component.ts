import { Component, Input, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BoardService, Card, Column } from '../../services/board.service';
import { CardComponent } from '../card/card.component';

@Component({
  selector: 'app-column',
  standalone: true,
  imports: [FormsModule, CardComponent],
  template: `
    <div class="column" #columnEl [class.drag-over]="isDragOver()" [class.touch-dragging]="isTouchDragging()" [attr.data-column-id]="columnId" (dragover)="onDragOver($event)" (dragleave)="onDragLeave($event)" (drop)="onDrop($event)">
      <div class="column-header">
        <h3>{{ column.title }}</h3>
        <div class="column-actions">
          <button class="col-btn" (click)="moveUp()" [disabled]="isFirst()" title="Move up">↑</button>
          <button class="col-btn" (click)="moveDown()" [disabled]="isLast()" title="Move down">↓</button>
          <button class="col-btn col-btn-danger" (click)="removeColumn()" title="Remove column">×</button>
        </div>
      </div>
      <div class="column-cards" #cardsContainer>
        @for (card of column.cards; track card.id) {
          <div class="card-wrapper" (touchstart)="onCardTouchStart($event, card)">
            <div class="card-click-area" (click)="onCardClick(card)">
              <app-card [card]="card" [columnId]="columnId"></app-card>
            </div>
          </div>
        }
      </div>
      <button class="add-card-btn" (click)="onAdd()">+ Add Card</button>
    </div>

    @if (showCreateCard()) {
      <div class="modal-overlay" (click)="closeCreateCard()">
        <div class="modal-content modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>New Card</h2>
            <button class="close-btn" (click)="closeCreateCard()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Title</label>
              <input type="text" #titleInput [(ngModel)]="newCardTitle" placeholder="Card title" (keydown.enter)="createCard()" autofocus />
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea [(ngModel)]="newCardDesc" rows="3" placeholder="Description"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeCreateCard()">Cancel</button>
            <div class="spacer"></div>
            <button class="btn-primary" (click)="createCard()">Create</button>
          </div>
        </div>
      </div>
    }

    @if (editingCard()) {
      <div class="modal-overlay" (click)="closeEditModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Edit Card</h2>
            <button class="close-btn" (click)="closeEditModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Title</label>
              <input type="text" [(ngModel)]="editForm.title" placeholder="Card title" />
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea [(ngModel)]="editForm.description" rows="3" placeholder="Description"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Priority</label>
                <select [(ngModel)]="editForm.priority">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div class="form-group">
                <label>Due Date</label>
                <input type="date" [(ngModel)]="editForm.dueDate" />
              </div>
              <div class="form-group">
                <label>Assignee</label>
                <input type="text" [(ngModel)]="editForm.assignee" placeholder="Name" />
              </div>
            </div>
            <div class="form-group">
              <label>Labels</label>
              <div class="labels-grid">
                @for (label of allLabels; track label.id) {
                  <label class="label-checkbox">
                    <input type="checkbox" [checked]="editForm.labelIds.includes(label.id)" (change)="toggleLabel(label.id)" />
                    <span class="label-preview" [style.background]="label.color">{{ label.name }}</span>
                  </label>
                }
              </div>
            </div>
            <div class="form-group">
              <label>Checklist</label>
              @for (item of editForm.checklist; track item.id) {
                <div class="checklist-item">
                  <input type="checkbox" [(ngModel)]="item.done" />
                  <input type="text" [(ngModel)]="item.text" [class.done]="item.done" />
                  <button class="remove-checklist" (click)="removeChecklistItem(item.id)">&times;</button>
                </div>
              }
              <button class="btn-small" (click)="addChecklistItem()">+ Add Item</button>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-danger" (click)="deleteCard()">Delete</button>
            <div class="spacer"></div>
            <button class="btn-secondary" (click)="closeEditModal()">Cancel</button>
            <button class="btn-primary" (click)="saveCard()">Save</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { flex-shrink: 0; width: 300px; display: flex; flex-direction: column; }

    .column {
      background: var(--bg-column);
      border-radius: 12px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      max-height: calc(100vh - 140px);
      min-height: 60px;
      transition: background 0.2s;
    }

    .column.drag-over, .column.touch-dragging {
      background: var(--hover-bg);
    }

    .column-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      padding: 4px 8px;
    }

    .column-header h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .column-actions {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .col-btn {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      width: 28px;
      height: 28px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }

    .col-btn:hover:not(:disabled) { background: var(--hover-bg); color: var(--text-primary); }
    .col-btn:disabled { opacity: 0.3; cursor: default; }
    .col-btn-danger:hover { background: #fef2f2; color: #ef4444; border-color: #ef4444; }

    .card-count {
      background: var(--border-color);
      color: var(--text-secondary);
      font-size: 11px;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 10px;
    }

    .column-cards {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 20px;
    }

    .card-wrapper {
      touch-action: none;
    }

    .card-click-area {
      cursor: pointer;
    }

    .add-card-btn {
      width: 100%;
      padding: 8px;
      margin-top: 8px;
      background: transparent;
      border: 2px dashed var(--border-color);
      border-radius: 8px;
      cursor: pointer;
      color: var(--text-secondary);
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;
    }

    .add-card-btn:hover {
      background: var(--hover-bg);
      border-color: var(--border-color);
    }

    .column-cards::-webkit-scrollbar { width: 4px; }
    .column-cards::-webkit-scrollbar-track { background: transparent; }
    .column-cards::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 2px; }

    /* Touch drag ghost */
    .touch-drag-ghost {
      position: fixed;
      pointer-events: none;
      z-index: 9999;
      opacity: 0.85;
      transform: rotate(3deg) scale(1.05);
    }

    .modal-sm { width: 420px; }

    /* Modal styles */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: var(--bg-secondary);
      border-radius: 16px;
      width: 520px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px var(--shadow-color);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-color);
    }

    .modal-header h2 { margin: 0; font-size: 18px; color: var(--text-primary); }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: var(--text-secondary);
    }

    .modal-body { padding: 20px 24px; }

    .form-group { margin-bottom: 16px; }

    .form-group label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 6px;
    }

    .form-group input[type="text"],
    .form-group input[type="date"],
    .form-group textarea,
    .form-group select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
      background: var(--bg-secondary);
      color: var(--text-primary);
    }

    .form-group input:focus,
    .form-group textarea:focus,
    .form-group select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
    }

    .form-row { display: flex; gap: 12px; }
    .form-row .form-group { flex: 1; }

    .labels-grid { display: flex; flex-wrap: wrap; gap: 8px; }

    .label-checkbox {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
    }

    .label-preview {
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 6px;
      color: white;
      font-weight: 600;
    }

    .checklist-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .checklist-item input[type="text"] {
      flex: 1;
      padding: 6px 8px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      font-size: 13px;
      background: var(--bg-secondary);
      color: var(--text-primary);
    }

    .checklist-item input[type="text"].done {
      text-decoration: line-through;
      color: #9ca3af;
    }

    .remove-checklist {
      background: none;
      border: none;
      color: #ef4444;
      cursor: pointer;
      font-size: 16px;
      padding: 2px 6px;
    }

    .modal-footer {
      display: flex;
      align-items: center;
      padding: 16px 24px;
      border-top: 1px solid var(--border-color);
    }

    .spacer { flex: 1; }

    .btn-primary {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
    }

    .btn-primary:hover { background: #2563eb; }

    .btn-secondary {
      background: var(--bg-column);
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
    }

    .btn-secondary:hover { background: var(--hover-bg); }

    .btn-danger {
      background: #ef4444;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
    }

    .btn-danger:hover { background: #dc2626; }

    .btn-small {
      background: transparent;
      border: 1px dashed var(--border-color);
      color: var(--text-secondary);
      padding: 4px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
    }

    .btn-small:hover { background: var(--hover-bg); }
  `],
})
export class ColumnComponent {
  private boardService = inject(BoardService);

  @Input() column!: Column;
  @Input() columnId!: string;

  isDragOver = signal(false);
  isTouchDragging = signal(false);
  showCreateCard = signal(false);
  editingCard = signal<Card | null>(null);
  newCardTitle = '';
  newCardDesc = '';

  editForm = {
    title: '', description: '', priority: 'medium' as Card['priority'],
    dueDate: '', assignee: '', labelIds: [] as string[], checklist: [] as any[]
  };

  allLabels = [
    { id: 'l1', name: 'Feature', color: '#3b82f6' },
    { id: 'l2', name: 'Bug', color: '#ef4444' },
    { id: 'l3', name: 'Improvement', color: '#10b981' },
    { id: 'l4', name: 'Documentation', color: '#8b5cf6' },
    { id: 'l5', name: 'Urgent', color: '#f59e0b' },
  ];

  // Touch drag state
  private touchGhostEl: HTMLElement | null = null;
  private touchDraggingCard: Card | null = null;

  isFirst(): boolean {
    const cols = this.boardService.columns();
    return cols[0]?.id === this.columnId;
  }

  isLast(): boolean {
    const cols = this.boardService.columns();
    return cols[cols.length - 1]?.id === this.columnId;
  }

  moveUp(): void { this.boardService.moveColumnUp(this.columnId); }
  moveDown(): void { this.boardService.moveColumnDown(this.columnId); }

  removeColumn(): void {
    if (confirm(`Remove column "${this.column.title}" and all its cards?`)) {
      this.boardService.removeColumn(this.columnId);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    const relatedTarget = event.relatedTarget;
    if (relatedTarget && (event.currentTarget as Node).contains(relatedTarget as Node)) return;
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);

    const cardId = event.dataTransfer?.getData('cardId');
    const fromColumnId = event.dataTransfer?.getData('fromColumnId');
    if (!cardId || !fromColumnId) return;

    const toColumnId = this.columnId;
    if (fromColumnId === toColumnId) return;

    this.boardService.moveCard(fromColumnId, toColumnId, cardId);
  }

  onCardClick(card: Card): void {
    const col = this.boardService.columns().find((c: any) => c.cards.some((c: any) => c.id === card.id));
    if (!col) return;

    this.editingCard.set(card);
    this.editForm = {
      title: card.title,
      description: card.description,
      priority: card.priority,
      dueDate: card.dueDate ?? '',
      assignee: card.assignee,
      labelIds: card.labels.map((l: any) => l.id),
      checklist: card.checklist.map((i: any) => ({ ...i }))
    };
  }

  closeEditModal(): void {
    this.editingCard.set(null);
  }

  toggleLabel(labelId: string): void {
    const idx = this.editForm.labelIds.indexOf(labelId);
    if (idx >= 0) this.editForm.labelIds.splice(idx, 1);
    else this.editForm.labelIds.push(labelId);
  }

  addChecklistItem(): void {
    this.editForm.checklist.push({ id: Date.now().toString(), text: '', done: false });
  }

  removeChecklistItem(id: string): void {
    this.editForm.checklist = this.editForm.checklist.filter(i => i.id !== id);
  }

  saveCard(): void {
    const card = this.editingCard();
    if (!card) return;

    const col = this.boardService.columns().find((c: any) => c.cards.some((c: any) => c.id === card.id));
    if (!col) return;

    const labels = this.allLabels.filter((l: any) => this.editForm.labelIds.includes(l.id));

    this.boardService.updateCard(col.id, card.id, {
      title: this.editForm.title,
      description: this.editForm.description,
      priority: this.editForm.priority,
      dueDate: this.editForm.dueDate || null,
      assignee: this.editForm.assignee,
      labels,
      checklist: this.editForm.checklist
    });

    this.closeEditModal();
  }

  deleteCard(): void {
    const card = this.editingCard();
    if (!card) return;

    const col = this.boardService.columns().find((c: any) => c.cards.some((c: any) => c.id === card.id));
    if (!col) return;

    if (confirm('Delete this card?')) {
      this.boardService.deleteCard(col.id, card.id);
    }

    this.closeEditModal();
  }

  // Touch drag support for mobile
  onCardTouchStart(event: Event, card: Card): void {
    const touchEvent = event as TouchEvent;
    const touch = touchEvent.touches[0];
    this.touchDraggingCard = card;
    this.isTouchDragging.set(true);

    // Create ghost element
    const cardWrapper = (event.target as HTMLElement).closest('.card-wrapper') as HTMLElement;
    if (!cardWrapper) return;

    const cardEl = cardWrapper.querySelector('app-card .card') as HTMLElement;
    if (!cardEl) return;

    this.touchGhostEl = cardEl.cloneNode(true) as HTMLElement;
    this.touchGhostEl.classList.add('touch-drag-ghost');
    this.touchGhostEl.style.width = cardEl.offsetWidth + 'px';
    this.touchGhostEl.style.left = (touch.clientX - 20) + 'px';
    this.touchGhostEl.style.top = (touch.clientY - 30) + 'px';
    document.body.appendChild(this.touchGhostEl);

    // Add touch listeners to document
    document.addEventListener('touchmove', this.onTouchMoveBound, { passive: false });
    document.addEventListener('touchend', this.onTouchEndBound);
  }

  private onTouchMoveBound = (event: TouchEvent) => {
    event.preventDefault();
    const touch = event.touches[0];
    if (this.touchGhostEl) {
      this.touchGhostEl.style.left = (touch.clientX - 20) + 'px';
      this.touchGhostEl.style.top = (touch.clientY - 30) + 'px';
    }

    // Highlight column under touch
    const cols = document.querySelectorAll('.column');
    cols.forEach(col => col.classList.remove('drag-over'));
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (el) {
      const col = (el as HTMLElement).closest('.column');
      if (col) col.classList.add('drag-over');
    }
  };

  private onTouchEndBound = (event: TouchEvent) => {
    const touch = event.changedTouches[0];

    // Find drop target
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (el) {
      const col = (el as HTMLElement).closest('.column') as HTMLElement;
      if (col) {
        const toColId = col.getAttribute('data-column-id');
        if (toColId && this.touchDraggingCard) {
          const fromColId = this.columnId;
          if (toColId !== fromColId) {
            this.boardService.moveCard(fromColId, toColId, this.touchDraggingCard.id);
          }
        }
      }
    }

    this.cleanupTouchDrag();
  };

  private cleanupTouchDrag(): void {
    if (this.touchGhostEl) {
      this.touchGhostEl.remove();
      this.touchGhostEl = null;
    }
    this.isTouchDragging.set(false);
    this.touchDraggingCard = null;
    document.removeEventListener('touchmove', this.onTouchMoveBound);
    document.removeEventListener('touchend', this.onTouchEndBound);
  }

  onAdd(): void {
    this.newCardTitle = '';
    this.newCardDesc = '';
    this.showCreateCard.set(true);
    setTimeout(() => {
      const input = document.querySelector('.modal-sm input[type="text"]') as HTMLInputElement;
      input?.focus();
    }, 100);
  }

  closeCreateCard(): void {
    this.showCreateCard.set(false);
    this.newCardTitle = '';
    this.newCardDesc = '';
  }

  createCard(): void {
    const title = this.newCardTitle.trim();
    if (!title) return;

    const newCard: Card = {
      id: 'card-' + Date.now(),
      title,
      description: this.newCardDesc,
      priority: 'medium',
      labels: [],
      checklist: [],
      dueDate: null,
      assignee: '',
    };

    this.boardService.addCard(this.columnId);

    // Update the newly added card with the title/description
    const cols = this.boardService.columns();
    const col = cols.find((c: any) => c.id === this.columnId);
    if (col && col.cards.length > 0) {
      const newCardObj = col.cards[0]; // addCard puts new card first
      this.boardService.updateCard(this.columnId, newCardObj.id, {
        title,
        description: this.newCardDesc,
      });
    }

    this.closeCreateCard();
  }
}
