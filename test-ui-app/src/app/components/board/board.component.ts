import { Component, computed, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BoardService, Card } from '../../services/board.service';
import { ColumnComponent } from '../column/column.component';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [ColumnComponent, FormsModule],
  template: `
    <div class="board-container">
      <div class="board-header">
        <h1>Kanban Board</h1>
        <div class="header-actions">
          <button class="btn-secondary" (click)="toggleTheme()" title="Toggle dark mode">{{ isDark() ? '☀️' : '🌙' }}</button>
          <button class="btn-secondary" (click)="onReset()">Reset Board</button>
          <button class="btn-primary" (click)="addColumn()">+ Add Column</button>
        </div>
      </div>

      <div class="board-columns">
        @for (col of columns(); track col.id) {
          <app-column [column]="col" [columnId]="col.id" (editCard)="onEditCard($event)"></app-column>
        }
      </div>
    </div>

    @if (editingCard()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Edit Card</h2>
            <button class="close-btn" (click)="closeModal()">&times;</button>
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
            <button class="btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn-primary" (click)="saveCard()">Save</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }

    .board-container { padding: 20px; }

    .board-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding: 0 8px;
    }

    .board-header h1 {
      font-size: 24px;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0;
    }

    .header-actions { display: flex; gap: 8px; }

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

    .board-columns {
      display: flex;
      gap: 16px;
      overflow-x: auto;
      padding-bottom: 16px;
      min-height: 400px;
    }

    .board-columns::-webkit-scrollbar { height: 6px; }
    .board-columns::-webkit-scrollbar-track { background: var(--bg-column); border-radius: 3px; }
    .board-columns::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 3px; }

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
  `],
})
export class BoardComponent {
  private boardService = new BoardService();

  isDark = signal(false);

  columns = computed(() => this.boardService.columns());
  editingCard = signal<Card | null>(null);
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

  addColumn(): void {
    const title = prompt('Column name:');
    if (title?.trim()) {
      this.boardService.addColumn(title.trim());
    }
  }

  onReset(): void {
    if (confirm('Reset the entire board to defaults?')) {
      this.boardService.resetBoard();
    }
  }

  toggleTheme(): void {
    this.isDark.update(d => !d);
    document.documentElement.setAttribute('data-theme', this.isDark() ? 'dark' : 'light');
  }

  onEditCard(card: Card): void {
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

  closeModal(): void {
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

    this.closeModal();
  }

  deleteCard(): void {
    const card = this.editingCard();
    if (!card) return;

    const col = this.boardService.columns().find((c: any) => c.cards.some((c: any) => c.id === card.id));
    if (!col) return;

    if (confirm('Delete this card?')) {
      this.boardService.deleteCard(col.id, card.id);
    }

    this.closeModal();
  }
}
