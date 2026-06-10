import { Injectable } from '@angular/core';

export type CellInput = number | null | string;

export type CellCoordinate = {
  row: number;
  col: number;
};

export type EvaluationResult = {
  isCorrect: boolean;
  isComplete: boolean;
  isUntouched: boolean;
  cellsLeft: number;
  incorrectCells: CellCoordinate[];
  incorrectRows: boolean[];
  incorrectCols: boolean[];
  incorrectBoxes: boolean[];
};

type CellConflicts = {
  rowConflict: boolean;
  colConflict: boolean;
  boxConflict: boolean;
};

@Injectable({
  providedIn: 'root',
})
export class SudokuGameService {
  createUserInput(puzzle: number[][]): CellInput[][] {
    return puzzle.map((row) => row.map((cell) => (cell === 0 ? null : cell)));
  }

  evaluateSolution(
    puzzle: number[][],
    userInput: CellInput[][]
  ): EvaluationResult {
    const incorrectCells: CellCoordinate[] = [];
    const incorrectRows = Array(9).fill(false);
    const incorrectCols = Array(9).fill(false);
    const incorrectBoxes = Array(9).fill(false);
    const normalizedInput = userInput.map((row) =>
      row.map((cell) => this.normalizeCellValue(cell))
    );
    const cellsUserNeedsToSolve = this.countEmptyPuzzleCells(puzzle);

    let isCorrect = true;
    let cellsLeft = cellsUserNeedsToSolve;
    let hasUserInput = false;

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const puzzleValue = puzzle[row][col];
        const userValue = userInput[row][col];

        if (puzzleValue !== 0) {
          continue;
        }

        if (userValue !== null && userValue !== '') {
          hasUserInput = true;
        }

        const normalizedValue = normalizedInput[row][col];

        if (
          userValue !== null &&
          userValue !== '' &&
          normalizedValue === null
        ) {
          isCorrect = false;
          incorrectCells.push({ row, col });
          continue;
        }

        if (normalizedValue === null) {
          continue;
        }

        const conflicts = this.getCellConflicts(
          row,
          col,
          normalizedValue,
          normalizedInput
        );

        if (this.hasConflicts(conflicts)) {
          isCorrect = false;
          incorrectCells.push({ row, col });
          this.markConflictRegions(
            row,
            col,
            conflicts,
            incorrectRows,
            incorrectCols,
            incorrectBoxes
          );
        } else {
          cellsLeft--;
        }
      }
    }

    return {
      isCorrect,
      isComplete: isCorrect && cellsLeft === 0,
      isUntouched: cellsLeft === cellsUserNeedsToSolve && !hasUserInput,
      cellsLeft,
      incorrectCells,
      incorrectRows,
      incorrectCols,
      incorrectBoxes,
    };
  }

  formatSeconds(totalSeconds: number | null): string {
    if (totalSeconds === null) {
      return '--:--';
    }

    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  normalizeCellValue(value: CellInput): number | null {
    if (value === null || value === '') {
      return null;
    }

    const numValue = typeof value === 'string' ? parseInt(value, 10) : value;

    if (!Number.isInteger(numValue) || numValue < 1 || numValue > 9) {
      return null;
    }

    return numValue;
  }

  private countEmptyPuzzleCells(puzzle: number[][]): number {
    return puzzle.reduce(
      (total, row) => total + row.filter((cell) => cell === 0).length,
      0
    );
  }

  private markConflictRegions(
    row: number,
    col: number,
    conflicts: CellConflicts,
    incorrectRows: boolean[],
    incorrectCols: boolean[],
    incorrectBoxes: boolean[]
  ): void {
    if (conflicts.rowConflict) {
      incorrectRows[row] = true;
    }

    if (conflicts.colConflict) {
      incorrectCols[col] = true;
    }

    if (conflicts.boxConflict) {
      incorrectBoxes[this.toBoxIndex(row, col)] = true;
    }
  }

  private hasConflicts(conflicts: CellConflicts): boolean {
    return (
      conflicts.rowConflict || conflicts.colConflict || conflicts.boxConflict
    );
  }

  private getCellConflicts(
    row: number,
    col: number,
    value: number,
    normalizedInput: (number | null)[][]
  ): CellConflicts {
    const conflicts: CellConflicts = {
      rowConflict: false,
      colConflict: false,
      boxConflict: false,
    };

    for (let c = 0; c < 9; c++) {
      if (c !== col && normalizedInput[row][c] === value) {
        conflicts.rowConflict = true;
        break;
      }
    }

    for (let r = 0; r < 9; r++) {
      if (r !== row && normalizedInput[r][col] === value) {
        conflicts.colConflict = true;
        break;
      }
    }

    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;

    for (let r = startRow; r < startRow + 3 && !conflicts.boxConflict; r++) {
      for (let c = startCol; c < startCol + 3; c++) {
        if ((r !== row || c !== col) && normalizedInput[r][c] === value) {
          conflicts.boxConflict = true;
          break;
        }
      }
    }

    return conflicts;
  }

  private toBoxIndex(row: number, col: number): number {
    return Math.floor(row / 3) * 3 + Math.floor(col / 3);
  }
}
