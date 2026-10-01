import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  QueryList,
  SimpleChanges,
  ViewChildren,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grid.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./grid.component.scss'],
})
export class GridComponent implements OnChanges {
  @Input() puzzle: number[][] = [];
  @Input() userInput: (number | null | string)[][] = [];
  @Input() incorrectCells: { row: number; col: number }[] = [];
  @Input() incorrectRows: boolean[] = Array(9).fill(false);
  @Input() incorrectCols: boolean[] = Array(9).fill(false);
  @Input() incorrectBoxes: boolean[] = Array(9).fill(false);
  @Input() highlightErrors: boolean = false;
  @Input() isPaused: boolean = false;
  @Input() isReadOnly: boolean = false;
  @Output() cellChange = new EventEmitter<void>();
  @Output() selectionChange = new EventEmitter<{
    row: number;
    col: number;
  } | null>();

  @ViewChildren('cellControl')
  private cellControls!: QueryList<
    ElementRef<HTMLInputElement | HTMLButtonElement>
  >;

  readonly indices = Array.from({ length: 9 }, (_, index) => index);
  selectedCell: { row: number; col: number } | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['puzzle'] && !changes['puzzle'].firstChange) {
      this.clearSelection();
    }
  }

  selectCell(row: number, col: number): void {
    if (this.isPaused || this.isReadOnly) return;
    this.selectedCell = { row, col };
    this.selectionChange.emit(this.selectedCell);
  }

  clearSelection(): void {
    this.selectedCell = null;
    this.selectionChange.emit(null);
  }

  isSelected(row: number, col: number): boolean {
    return (
      !this.isPaused &&
      this.selectedCell?.row === row &&
      this.selectedCell?.col === col
    );
  }

  isPeer(row: number, col: number): boolean {
    if (this.isPaused || !this.selectedCell || this.isSelected(row, col)) {
      return false;
    }
    return (
      this.selectedCell.row === row ||
      this.selectedCell.col === col ||
      this.getBoxIndex(this.selectedCell.row, this.selectedCell.col) ===
        this.getBoxIndex(row, col)
    );
  }

  cellTabIndex(row: number, col: number): number {
    if (this.isPaused || this.isReadOnly) return -1;
    const target = this.selectedCell ?? { row: 0, col: 0 };
    return target.row === row && target.col === col ? 0 : -1;
  }

  enterNumber(value: number | null): void {
    if (this.isPaused || this.isReadOnly || !this.selectedCell) return;
    const { row, col } = this.selectedCell;
    if (this.puzzle[row]?.[col] !== 0) return;
    if (
      value !== null &&
      (!Number.isInteger(value) || value < 1 || value > 9)
    ) {
      return;
    }

    if (this.userInput[row][col] !== value) {
      this.userInput[row][col] = value;
      this.onCellChange();
    }
    this.focusCell(row, col);
  }

  onInput(event: Event, row: number, col: number): void {
    const input = event.target as HTMLInputElement;
    if (
      !this.isPaused &&
      !this.isReadOnly &&
      this.puzzle[row][col] === 0 &&
      /^(?:[1-9])?$/.test(input.value)
    ) {
      this.selectCell(row, col);
      this.enterNumber(input.value === '' ? null : Number(input.value));
    }
    input.value = String(this.userInput[row][col] ?? '');
  }

  onKeyDown(event: KeyboardEvent, row: number, col: number): void {
    if (this.isPaused || this.isReadOnly || event.ctrlKey || event.metaKey) {
      return;
    }

    const directions: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    const direction = directions[event.key];
    if (direction) {
      event.preventDefault();
      this.focusCell(
        Math.max(0, Math.min(8, row + direction[0])),
        Math.max(0, Math.min(8, col + direction[1]))
      );
      return;
    }

    if (/^[1-9]$/.test(event.key)) {
      event.preventDefault();
      this.selectCell(row, col);
      this.enterNumber(Number(event.key));
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      this.selectCell(row, col);
      this.enterNumber(null);
    } else if (event.key.length === 1) {
      event.preventDefault();
    }
  }

  private focusCell(row: number, col: number): void {
    const control = this.cellControls.get(row * 9 + col)?.nativeElement;
    control?.focus({ preventScroll: true });
    if (control instanceof HTMLInputElement) control.select();
  }

  private shouldHighlightErrors(): boolean {
    return this.highlightErrors && !this.isPaused;
  }

  isCellIncorrect(row: number, col: number): boolean {
    return (
      this.shouldHighlightErrors() &&
      this.incorrectCells.some((cell) => cell.row === row && cell.col === col)
    );
  }

  isRowIncorrect(row: number): boolean {
    return this.shouldHighlightErrors() && this.incorrectRows[row];
  }

  isColIncorrect(col: number): boolean {
    return this.shouldHighlightErrors() && this.incorrectCols[col];
  }

  isBoxIncorrect(row: number, col: number): boolean {
    const boxIndex = this.getBoxIndex(row, col);
    return this.shouldHighlightErrors() && this.incorrectBoxes[boxIndex];
  }

  getCellClasses(row: number, col: number): Record<string, boolean> {
    return {
      incorrect: this.isCellIncorrect(row, col),
      'error-row': this.isRowIncorrect(row),
      'error-col': this.isColIncorrect(col),
      'error-box': this.isBoxIncorrect(row, col),
    };
  }

  onCellChange(): void {
    this.cellChange.emit();
  }

  private getBoxIndex(row: number, col: number): number {
    return Math.floor(row / 3) * 3 + Math.floor(col / 3);
  }
}
