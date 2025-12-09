import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SudokuService } from '../sudoku.service';
import { Difficulty, MessageType } from './sudoku.interface';

import { HeaderComponent } from './header/header.component';
import { GridComponent } from './grid/grid.component';

@Component({
  selector: 'app-sudoku',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    GridComponent,
    HeaderComponent
  ],
  templateUrl: './sudoku.component.html',
  styleUrls: ['./sudoku.component.scss']
})
export class SudokuComponent implements OnInit, OnDestroy {
  puzzle: number[][] = [];
  userInput: (number | null | string)[][] = [];
  userMessage: string = '';

  elapsedSeconds: number = 0;
  isPaused: boolean = false;
  isCompleted: boolean = false;
  private timerId: ReturnType<typeof setInterval> | null = null;

  highlightErrors: boolean = false;
  incorrectCells: { row: number; col: number }[] = [];

  difficulty: Difficulty = Difficulty.Easy;
  Difficulty = Difficulty;
  difficultyLevels = [
    { label: 'Easy', value: Difficulty.Easy },
    { label: 'Medium', value: Difficulty.Medium },
    { label: 'Hard', value: Difficulty.Hard }
  ];

  constructor(private sudokuService: SudokuService) {}

  ngOnInit(): void {
    this.fetchPuzzle();
    this.setUserMessage(MessageType.Welcome);
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  fetchPuzzle(): void {
    this.sudokuService.getSudokuPuzzle(this.difficulty).subscribe(data => {
      this.puzzle = data.puzzle;
      this.initializeUserInput();
      this.resetTimer();
    });
  }

  initializeUserInput(): void {
    this.userInput = this.puzzle.map(row => row.map(cell => (cell === 0 ? null : cell)));
    this.highlightErrors = false;
  }

  onDifficultyChange(event: Event): void {
    const newDifficulty = (event.target as HTMLSelectElement).value as Difficulty;
    this.difficulty = newDifficulty;
    this.fetchPuzzle();
    this.setUserMessage(MessageType.DifficultyChange, newDifficulty);
  }

  checkSolution(): void {
    this.highlightErrors = true;
    this.incorrectCells = [];
    let isCorrect = true;

    const cellsUserNeedsToSolve = {
      [Difficulty.Easy]: 45,
      [Difficulty.Medium]: 51,
      [Difficulty.Hard]: 55
    }[this.difficulty];

    let cellsLeft = cellsUserNeedsToSolve;

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const puzzleValue = this.puzzle[row][col];
        const userValue = this.userInput[row][col];

        if (puzzleValue !== 0) {
          continue;
        }

        if (userValue === null || userValue === '') {
          continue;
        }

        if (this.isValidInput(row, col, userValue)) {
          cellsLeft--;
        } else {
          isCorrect = false;
          this.incorrectCells.push({ row, col });
        }
      }
    }

    if (cellsLeft === cellsUserNeedsToSolve && !this.userInput.flat().some(cell => cell !== null)) {
      this.setUserMessage(MessageType.Welcome);
    } else if (isCorrect && cellsLeft > 0) {
      this.setUserMessage(MessageType.Progress, cellsLeft);
    } else if (!isCorrect) {
      this.setUserMessage(MessageType.Failure);
    } else if (isCorrect && cellsLeft === 0) {
      this.isCompleted = true;
      this.isPaused = false;
      this.clearTimer();
      this.setUserMessage(MessageType.Success);
    }
  }

  toggleTimer(): void {
    if (this.isPaused) {
      this.resumeTimer();
    } else {
      this.pauseTimer();
    }
  }

  pauseTimer(): void {
    this.isPaused = true;
    this.clearTimer();
  }

  resumeTimer(): void {
    if (this.timerId) {
      return;
    }

    this.startTimer();
  }

  formatTime(): string {
    const minutes = Math.floor(this.elapsedSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (this.elapsedSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  }

  private resetTimer(): void {
    this.elapsedSeconds = 0;
    this.isCompleted = false;
    this.startTimer();
  }

  private startTimer(): void {
    if (this.isCompleted) {
      return;
    }

    this.clearTimer();
    this.isPaused = false;
    this.timerId = setInterval(() => {
      this.elapsedSeconds += 1;
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  clearUserInput(): void {
    this.userInput = this.puzzle.map(row => row.map(cell => (cell === 0 ? null : cell)));
    this.highlightErrors = false;
    this.setUserMessage(MessageType.ClearInput);
  }

  toggleHighlighting(): void {
    this.highlightErrors = !this.highlightErrors;

    if (!this.highlightErrors) {
      this.incorrectCells = [];
    } else {
      this.checkSolution();
    }
  }

  private setUserMessage(type: MessageType, additionalInfo?: any): void {
    switch (type) {
      case MessageType.Welcome:
        this.userMessage = 'Welcome! Here is your puzzle. Good luck!';
        break;
      case MessageType.DifficultyChange:
        this.userMessage = `Difficulty changed to ${additionalInfo}. Here is your new puzzle!`;
        break;
      case MessageType.Success:
        this.userMessage = 'Great job! You solved the puzzle!';
        break;
      case MessageType.Failure:
        this.userMessage = 'Oops! Some numbers are incorrect, try again!';
        break;
      case MessageType.ClearInput:
        this.userMessage = 'Your input has been cleared, start fresh!';
        break;
      case MessageType.Progress:
        this.userMessage = `Everything looks good so far, still ${additionalInfo} to go!`;
        break;
      default:
        this.userMessage = 'An unknown action occurred.';
        break;
    }
  }

  private isValidInput(row: number, col: number, value: number | string): boolean {
    const numValue = typeof value === 'string' ? parseInt(value, 10) : value;

    if (isNaN(numValue) || numValue < 1 || numValue > 9) {
      return false;
    }

    for (let c = 0; c < 9; c++) {
      if (c !== col && this.userInput[row][c] === numValue) {
        return false;
      }
    }

    for (let r = 0; r < 9; r++) {
      if (r !== row && this.userInput[r][col] === numValue) {
        return false;
      }
    }

    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let r = startRow; r < startRow + 3; r++) {
      for (let c = startCol; c < startCol + 3; c++) {
        if ((r !== row || c !== col) && this.userInput[r][c] === numValue) {
          return false;
        }
      }
    }

    return true;
  }
}
