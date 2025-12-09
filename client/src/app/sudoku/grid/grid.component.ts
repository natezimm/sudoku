import { Component, Input } from '@angular/core';
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
  @Input() highlightErrors: boolean = false;
  @Input() isPaused: boolean = false;

  isCellIncorrect(row: number, col: number): boolean {
    return (
      this.highlightErrors &&
      this.incorrectCells.some(cell => cell.row === row && cell.col === col)
    );
  }
}
