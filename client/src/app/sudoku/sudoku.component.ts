import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SudokuService } from '../sudoku.service';
import { Difficulty, MessageType } from './sudoku.interface';
import { StatsService, SudokuStats } from './stats.service';
import { GameStorageService, SavedGameState } from './game-storage.service';
import { ThemeService } from '../theme.service';

import { HeaderComponent } from './header/header.component';
import { GridComponent } from './grid/grid.component';

type CellConflicts = {
  rowConflict: boolean;
  colConflict: boolean;
  boxConflict: boolean;
};

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
  stats: SudokuStats;
  showStats: boolean = false;
  showResumePrompt: boolean = false;
  showDifficultyConfirm: boolean = false;
  resumeCandidate: SavedGameState | null = null;
  isDarkMode: boolean = false;

  elapsedSeconds: number = 0;
  isPaused: boolean = false;
  isCompleted: boolean = false;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private resumeTimerAfterDifficultyConfirm: boolean = false;

  highlightErrors: boolean = false;
  incorrectCells: { row: number; col: number }[] = [];
  incorrectRows: boolean[] = Array(9).fill(false);
  incorrectCols: boolean[] = Array(9).fill(false);
  incorrectBoxes: boolean[] = Array(9).fill(false);

  difficulty: Difficulty = Difficulty.Easy;
  selectedDifficulty: Difficulty = Difficulty.Easy;
  pendingDifficulty: Difficulty | null = null;
  Difficulty = Difficulty;
  difficultyLevels = [
    { label: 'Easy', value: Difficulty.Easy },
    { label: 'Medium', value: Difficulty.Medium },
    { label: 'Hard', value: Difficulty.Hard }
  ];
  statsViewOrder: { key: Difficulty; label: string }[] = [
    { key: Difficulty.Easy, label: 'Easy' },
    { key: Difficulty.Medium, label: 'Medium' },
    { key: Difficulty.Hard, label: 'Hard' }
  ];

  constructor(
    private sudokuService: SudokuService,
    private statsService: StatsService,
    private gameStorageService: GameStorageService,
    private themeService: ThemeService
  ) {
    this.stats = this.statsService.getStats();
    this.selectedDifficulty = this.difficulty;
    this.isDarkMode = this.themeService.isDarkMode;
  }

  ngOnInit(): void {
    this.isDarkMode = this.themeService.isDarkMode;
    const savedGame = this.gameStorageService.load();

    if (savedGame) {
      this.resumeCandidate = savedGame;
      this.showResumePrompt = true;
      this.userMessage = 'Resume your previous puzzle or start a fresh one.';
      return;
    }

    this.startNewGame();
  }

  ngOnDestroy(): void {
    this.persistGameState();
    this.clearTimer();
  }

  startNewGame(): void {
    this.showResumePrompt = false;
    this.resumeCandidate = null;
    this.gameStorageService.clear();
    this.selectedDifficulty = this.difficulty;
    this.fetchPuzzle();
    this.setUserMessage(MessageType.Welcome);
  }

  fetchPuzzle(): void {
    this.sudokuService.getSudokuPuzzle(this.difficulty).subscribe(data => {
      this.puzzle = data.puzzle;
      this.initializeUserInput();
      this.resetTimer();
      this.persistGameState();
    });
  }

  initializeUserInput(): void {
    this.userInput = this.puzzle.map(row => row.map(cell => (cell === 0 ? null : cell)));
    this.resetErrorTracking();
    this.highlightErrors = false;
  }

  private resetErrorTracking(): void {
    this.incorrectCells = [];
    this.incorrectRows = Array(9).fill(false);
    this.incorrectCols = Array(9).fill(false);
    this.incorrectBoxes = Array(9).fill(false);
  }

  onDifficultyChange(): void {
    if (this.showDifficultyConfirm || this.selectedDifficulty === this.difficulty) {
      return;
    }

    this.pendingDifficulty = this.selectedDifficulty;
    this.showDifficultyConfirm = true;

    const timerWasRunning = this.timerId !== null && !this.isPaused;
    this.resumeTimerAfterDifficultyConfirm = timerWasRunning;

    if (timerWasRunning) {
      this.pauseTimer();
    }
  }

  onDifficultySelect(difficulty: Difficulty): void {
    this.selectedDifficulty = difficulty;
    this.onDifficultyChange();
  }

  confirmDifficultyChange(): void {
    if (!this.pendingDifficulty) {
      this.cancelDifficultyChange();
      return;
    }

    const newDifficulty = this.pendingDifficulty;
    this.showDifficultyConfirm = false;
    this.pendingDifficulty = null;
    this.resumeTimerAfterDifficultyConfirm = false;

    this.difficulty = newDifficulty;
    this.selectedDifficulty = newDifficulty;
    this.showResumePrompt = false;
    this.resumeCandidate = null;
    this.gameStorageService.clear();
    this.fetchPuzzle();
    this.setUserMessage(MessageType.DifficultyChange, newDifficulty);
  }

  cancelDifficultyChange(): void {
    this.showDifficultyConfirm = false;
    this.pendingDifficulty = null;
    this.selectedDifficulty = this.difficulty;

    if (this.resumeTimerAfterDifficultyConfirm) {
      this.resumeTimerAfterDifficultyConfirm = false;
      this.resumeTimer();
    }
  }

  getDifficultyLabel(difficulty: Difficulty | null): string {
    if (!difficulty) {
      return '';
    }

    return this.difficultyLevels.find(level => level.value === difficulty)?.label ?? difficulty;
  }

  resumeSavedGame(): void {
    if (!this.resumeCandidate) {
      this.startNewGame();
      return;
    }

    const savedGame = this.resumeCandidate;
    this.puzzle = savedGame.puzzle;
    this.userInput = savedGame.userInput;
    this.difficulty = savedGame.difficulty;
    this.selectedDifficulty = savedGame.difficulty;
    this.elapsedSeconds = savedGame.elapsedSeconds;
    this.isPaused = savedGame.isPaused;
    this.isCompleted = false;
    this.highlightErrors = savedGame.highlightErrors;
    this.incorrectCells = savedGame.incorrectCells ?? [];
    this.incorrectRows = savedGame.incorrectRows ?? Array(9).fill(false);
    this.incorrectCols = savedGame.incorrectCols ?? Array(9).fill(false);
    this.incorrectBoxes = savedGame.incorrectBoxes ?? Array(9).fill(false);
    this.userMessage = savedGame.userMessage || 'Resuming your saved puzzle.';
    this.showResumePrompt = false;
    this.resumeCandidate = null;
    this.showStats = false;

    this.clearTimer();

    if (!this.isPaused) {
      this.startTimer();
    } else {
      this.persistGameState();
    }
  }

  checkSolution(): void {
    this.highlightErrors = true;
    this.resetErrorTracking();
    let isCorrect = true;

    const normalizedInput = this.userInput.map(row =>
      row.map(cell => this.normalizeCellValue(cell))
    );

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

        const normalizedValue = normalizedInput[row][col];

        if (userValue !== null && userValue !== '' && normalizedValue === null) {
          isCorrect = false;
          this.incorrectCells.push({ row, col });
          continue;
        }

        if (normalizedValue === null) {
          continue;
        }

        const conflicts = this.getCellConflicts(row, col, normalizedValue, normalizedInput);

        if (this.hasConflicts(conflicts)) {
          isCorrect = false;
          this.incorrectCells.push({ row, col });
          this.markConflictRegions(row, col, conflicts);
        } else {
          cellsLeft--;
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
      this.updateStatsOnCompletion();
      this.setUserMessage(MessageType.Success);
      this.gameStorageService.clear();
      return;
    }

    this.persistGameState();
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
    this.persistGameState();
  }

  resumeTimer(): void {
    if (this.timerId) {
      return;
    }

    this.startTimer();
  }

  formatTime(): string {
    return this.formatSeconds(this.elapsedSeconds);
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
      this.persistGameState();
    }, 1000);
    this.persistGameState();
  }

  private clearTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  clearUserInput(): void {
    this.userInput = this.puzzle.map(row => row.map(cell => (cell === 0 ? null : cell)));
    this.resetErrorTracking();
    this.highlightErrors = false;
    this.setUserMessage(MessageType.ClearInput);
    this.persistGameState();
  }

  onCellInputChange(): void {
    this.persistGameState();
  }

  toggleHighlighting(): void {
    this.highlightErrors = !this.highlightErrors;

    if (!this.highlightErrors) {
      this.resetErrorTracking();
    } else {
      this.checkSolution();
    }

    this.persistGameState();
  }

  toggleStats(): void {
    this.showStats = !this.showStats;
  }

  toggleTheme(): void {
    this.themeService.toggle();
    this.isDarkMode = this.themeService.isDarkMode;
  }

  private updateStatsOnCompletion(): void {
    this.stats = this.statsService.recordCompletion(this.difficulty, this.elapsedSeconds);
  }

  private markConflictRegions(row: number, col: number, conflicts: CellConflicts): void {
    if (conflicts.rowConflict) {
      this.incorrectRows[row] = true;
    }

    if (conflicts.colConflict) {
      this.incorrectCols[col] = true;
    }

    if (conflicts.boxConflict) {
      const boxIndex = this.toBoxIndex(row, col);
      this.incorrectBoxes[boxIndex] = true;
    }
  }

  private hasConflicts(conflicts: CellConflicts): boolean {
    return conflicts.rowConflict || conflicts.colConflict || conflicts.boxConflict;
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
      boxConflict: false
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

  private persistGameState(): void {
    if (!this.puzzle.length || !this.userInput.length || this.isCompleted) {
      return;
    }

    const gameState: SavedGameState = {
      puzzle: this.puzzle,
      userInput: this.userInput,
      difficulty: this.difficulty,
      elapsedSeconds: this.elapsedSeconds,
      isPaused: this.isPaused,
      highlightErrors: this.highlightErrors,
      userMessage: this.userMessage,
      incorrectCells: this.incorrectCells,
      incorrectRows: this.incorrectRows,
      incorrectCols: this.incorrectCols,
      incorrectBoxes: this.incorrectBoxes
    };

    this.gameStorageService.save(gameState);
  }

  private normalizeCellValue(value: number | string | null): number | null {
    if (value === null || value === '') {
      return null;
    }

    const numValue = typeof value === 'string' ? parseInt(value, 10) : value;

    if (!Number.isInteger(numValue) || numValue < 1 || numValue > 9) {
      return null;
    }

    return numValue;
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: KeyboardEvent): void {
    if (!this.showDifficultyConfirm) {
      return;
    }

    event.preventDefault();
    this.cancelDifficultyChange();
  }
}
