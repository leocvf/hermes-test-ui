import { Component, input, output, inject } from '@angular/core';
import { BoardService, Card } from '../../services/board.service';
import { CardComponent } from '../card/card.component';

@Component({
  selector: 'app-column',
  standalone: true,
  imports: [CardComponent],
  template: `
    <div class="column" (dragover)="onDragOver($event)" (drop)="onDrop($event)" [attr.data-column-id]="columnId()">
      <div class="column-header">
        <h3>{{ column().title }}</h3>
        <span class="card-count">{{ column().cards.length }}</span>
      </div>
      <div class="column-cards">
        @for (card of column().cards; track card.id) {
          <app-card [card]="card" [columnId]="columnId()" (edit)="onEditCard($event)"></app-card>
        }
      </div>
      <button class="add-card-btn" (click)="onAdd()">+ Add Card</button>
    </div>
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

    .column.drag-over {
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
  `],
})
export class ColumnComponent {
  private boardService = inject(BoardService);

  column = input.required<{ id: string; title: string; cards: Card[]; order: number }>();
  columnId = input.required<string>();

  editCard = output<Card>();

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    const col = event.currentTarget as HTMLElement;
    col.classList.add('drag-over');
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const col = event.currentTarget as HTMLElement;
    col.classList.remove('drag-over');

    const cardId = event.dataTransfer?.getData('cardId');
    const fromColumnId = event.dataTransfer?.getData('fromColumnId');
    if (!cardId || !fromColumnId) return;

    const toColumnEl = event.currentTarget as HTMLElement;
    const toColumnId = toColumnEl.getAttribute('data-column-id') ?? '';
    if (fromColumnId === toColumnId) return;

    this.boardService.moveCard(fromColumnId, toColumnId, cardId);
  }

  onAdd(): void {
    this.boardService.addCard(this.columnId());
  }

  onEditCard(card: Card): void {
    this.editCard.emit(card);
  }
}
