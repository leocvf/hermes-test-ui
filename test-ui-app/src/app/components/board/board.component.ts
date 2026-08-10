import { Component, computed, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BoardService } from '../../services/board.service';
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
          <app-column [column]="col" [columnId]="col.id"></app-column>
        }
      </div>
    </div>
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
  `],
})
export class BoardComponent {
  private boardService = inject(BoardService);

  isDark = signal(false);

  columns = computed(() => this.boardService.columns());

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
}
