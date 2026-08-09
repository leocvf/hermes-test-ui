import { Component, input, output } from '@angular/core';
import { Card } from '../../services/board.service';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [],
  template: `
    <div class="card" draggable="true" (dragstart)="onDragStart($event)" (click)="onEdit()">
      <div class="card-labels">
        @for (label of card().labels; track label.id) {
          <span class="label-badge" [style.background]="label.color">{{ label.name }}</span>
        }
      </div>
      <div class="card-title">{{ card().title }}</div>
      <div class="card-meta">
        @if (card().assignee) {
          <span class="assignee-avatar">{{ card().assignee.charAt(0).toUpperCase() }}</span>
        }
        @if (card().dueDate) {
          <span class="due-date" [class.overdue]="isOverdue()">
            {{ formatDate(card().dueDate ?? '') }}
          </span>
        }
        <span class="priority-badge priority-{{ card().priority }}">
          {{ card().priority }}
        </span>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .card {
      background: white;
      border-radius: 8px;
      padding: 10px 12px;
      cursor: grab;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      border-left: 3px solid transparent;
      transition: all 0.15s ease;
      user-select: none;
    }

    .card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      transform: translateY(-1px);
    }

    .card:active { cursor: grabbing; }

    .card.urgent { border-left-color: #ef4444; }
    .card.high { border-left-color: #f97316; }
    .card.medium { border-left-color: #eab308; }
    .card.low { border-left-color: #22c55e; }

    .card-labels { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px; }

    .label-badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      color: white;
      font-weight: 600;
    }

    .card-title {
      font-size: 13px;
      font-weight: 500;
      color: #1e293b;
      margin-bottom: 6px;
      line-height: 1.4;
    }

    .card-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .assignee-avatar {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #6366f1;
      color: white;
      font-size: 11px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .due-date {
      font-size: 11px;
      color: #64748b;
    }

    .due-date.overdue { color: #ef4444; font-weight: 600; }

    .priority-badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
      text-transform: capitalize;
    }

    .priority-low { background: #dcfce7; color: #166534; }
    .priority-medium { background: #fef9c3; color: #854d0e; }
    .priority-high { background: #fed7aa; color: #9a3412; }
    .priority-urgent { background: #fecaca; color: #991b1b; }
  `],
})
export class CardComponent {
  card = input.required<Card>();
  columnId = input.required<string>();

  edit = output<Card>();

  isOverdue(): boolean {
    const dueDate = this.card().dueDate;
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  onDragStart(event: DragEvent): void {
    event.dataTransfer?.setData('cardId', this.card().id);
    event.dataTransfer?.setData('fromColumnId', this.columnId());
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onEdit(): void {
    this.edit.emit(this.card());
  }
}
