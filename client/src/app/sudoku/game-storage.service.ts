import { Injectable } from '@angular/core';
import { Difficulty } from './sudoku.interface';

export interface SavedGameState {
  puzzle: number[][];
  userInput: (number | null | string)[][];
  difficulty: Difficulty;
  elapsedSeconds: number;
  isPaused: boolean;
  highlightErrors: boolean;
  userMessage: string;
  incorrectCells: { row: number; col: number }[];
  incorrectRows: boolean[];
  incorrectCols: boolean[];
  incorrectBoxes: boolean[];
}

@Injectable({
  providedIn: 'root'
})
export class GameStorageService {
  private readonly storageKey = 'sudokuActiveGame';

  save(state: SavedGameState): void {
    localStorage.setItem(this.storageKey, JSON.stringify(state));
  }

  load(): SavedGameState | null {
    const savedState = localStorage.getItem(this.storageKey);

    if (!savedState) {
      return null;
    }

    try {
      const parsed = JSON.parse(savedState);

      if (!this.isValidState(parsed)) {
        return null;
      }

      return this.cloneState(parsed);
    } catch {
      return null;
    }
  }

  clear(): void {
    localStorage.removeItem(this.storageKey);
  }

  private cloneState(state: SavedGameState): SavedGameState {
    return {
      ...state,
      puzzle: this.cloneNumberGrid(state.puzzle),
      userInput: this.cloneInputGrid(state.userInput),
      incorrectCells: Array.isArray(state.incorrectCells) ? state.incorrectCells.map(cell => ({ ...cell })) : [],
      incorrectRows: this.cloneBooleanRow(state.incorrectRows),
      incorrectCols: this.cloneBooleanRow(state.incorrectCols),
      incorrectBoxes: this.cloneBooleanRow(state.incorrectBoxes)
    };
  }

  private cloneNumberGrid(grid: number[][]): number[][] {
    return grid.map(row => [...row]);
  }

  private cloneInputGrid(grid: (number | null | string)[][]): (number | null | string)[][] {
    return grid.map(row => [...row]);
  }

  private cloneBooleanRow(row: boolean[] | undefined): boolean[] {
    return Array.isArray(row) && row.length === 9 ? [...row] : Array(9).fill(false);
  }

  private isValidState(state: any): state is SavedGameState {
    return (
      state &&
      this.isValidGrid(state.puzzle, false) &&
      this.isValidGrid(state.userInput, true) &&
      Object.values(Difficulty).includes(state.difficulty) &&
      typeof state.elapsedSeconds === 'number' &&
      typeof state.isPaused === 'boolean' &&
      typeof state.highlightErrors === 'boolean' &&
      typeof state.userMessage === 'string'
    );
  }

  private isValidGrid(grid: any, allowStrings: false): grid is number[][];
  private isValidGrid(grid: any, allowStrings: true): grid is (number | null | string)[][];
  private isValidGrid(grid: any, allowStrings: boolean): grid is (number | null | string)[][] {
    if (!Array.isArray(grid) || grid.length !== 9) {
      return false;
    }

    return grid.every(
      (row: any) =>
        Array.isArray(row) &&
        row.length === 9 &&
        row.every((cell: any) => this.isValidCell(cell, allowStrings))
    );
  }

  private isValidCell(cell: any, allowStrings: boolean): boolean {
    if (cell === null) {
      return allowStrings;
    }

    if (typeof cell === 'number') {
      return Number.isInteger(cell);
    }

    if (!allowStrings) {
      return false;
    }

    return typeof cell === 'string' && cell.length <= 1;
  }
}
