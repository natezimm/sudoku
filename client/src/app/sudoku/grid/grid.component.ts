import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-grid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.scss']
})
export class GridComponent {
  @Input() puzzle: number[][] = [];
  @Input() userInput: (number | null | string)[][] = [];
  @Input() incorrectCells: { row: number; col: number }[] = [];
  @Input() incorrectRows: boolean[] = Array(9).fill(false);
  @Input() incorrectCols: boolean[] = Array(9).fill(false);
  @Input() incorrectBoxes: boolean[] = Array(9).fill(false);
  @Input() highlightErrors: boolean = false;
  @Input() isPaused: boolean = false;
  @Output() cellChange = new EventEmitter<void>();

  isCellIncorrect(row: number, col: number): boolean {
    return (
      this.highlightErrors &&
      this.incorrectCells.some(cell => cell.row === row && cell.col === col)
    );
  }

  isRowIncorrect(row: number): boolean {
    return this.highlightErrors && this.incorrectRows[row];
  }

  isColIncorrect(col: number): boolean {
    return this.highlightErrors && this.incorrectCols[col];
  }

  isBoxIncorrect(row: number, col: number): boolean {
    const boxIndex = this.getBoxIndex(row, col);
    return this.highlightErrors && this.incorrectBoxes[boxIndex];
  }

  getCellClasses(row: number, col: number): Record<string, boolean> {
    return {
      incorrect: this.isCellIncorrect(row, col),
      'error-row': this.isRowIncorrect(row),
      'error-col': this.isColIncorrect(col),
      'error-box': this.isBoxIncorrect(row, col)
    };
  }

  onCellChange(): void {
    this.cellChange.emit();
  }

  private getBoxIndex(row: number, col: number): number {
    return Math.floor(row / 3) * 3 + Math.floor(col / 3);
  }
}
