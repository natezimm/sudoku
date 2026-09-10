import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SudokuService } from '../sudoku.service';
import { Difficulty, MessageType } from './sudoku.interface';
import { StatsService, SudokuStats } from './stats.service';
import { GameStorageService, SavedGameState } from './game-storage.service';
import { CellInput, SudokuGameService } from './sudoku-game.service';
import { ThemeService } from '../theme.service';

import { HeaderComponent } from './header/header.component';
import { GridComponent } from './grid/grid.component';

@Component({
  selector: 'app-sudoku',
  standalone: true,
  imports: [CommonModule, FormsModule, GridComponent, HeaderComponent],
  templateUrl: './sudoku.component.html',
  styleUrls: ['./sudoku.component.scss'],
})
export class SudokuComponent implements OnInit, OnDestroy {
  @ViewChild(GridComponent) grid?: GridComponent;
  private dialogElement?: HTMLElement;
  private previousFocus?: HTMLElement;
  @ViewChild('activeDialog') set activeDialog(
    ref: ElementRef<HTMLElement> | undefined
  ) {
    this.dialogElement = ref?.nativeElement;
    if (this.dialogElement) {
      this.previousFocus = document.activeElement as HTMLElement;
      this.dialogElement.focus();
    } else {
      this.previousFocus?.focus();
    }
  }
  readonly numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  selectedCell: { row: number; col: number } | null = null;
  isLoading = false;
  loadError = false;

  get emptyCells(): number {
    return this.puzzle.flat().filter((value) => value === 0).length;
  }

  get filledCells(): number {
    return this.puzzle.reduce(
      (count, row, r) =>
        count +
        row.filter(
          (value, c) =>
            value === 0 &&
            this.sudokuGameService.normalizeCellValue(
              this.userInput[r]?.[c]
            ) !== null
        ).length,
      0
    );
  }

  get progressPercent(): number {
    return this.emptyCells ? (this.filledCells / this.emptyCells) * 100 : 0;
  }

  get selectionIsGiven(): boolean {
    return (
      this.selectedCell !== null &&
      this.puzzle[this.selectedCell.row]?.[this.selectedCell.col] !== 0
    );
  }

  enterNumber(value: number | null): void {
    if (this.isPaused || this.isCompleted || this.isLoading || this.loadError)
      return;
    if (!this.selectedCell) {
      this.userMessage = 'Select an empty cell on the board first.';
      return;
    }
    if (this.selectionIsGiven) return;
    this.grid?.enterNumber(value);
  }

  requestNewPuzzle(): void {
    this.pendingDifficulty = this.difficulty;
    this.showDifficultyConfirm = true;
    this.resumeTimerAfterDifficultyConfirm =
      this.timerId !== null && !this.isPaused;
    if (this.resumeTimerAfterDifficultyConfirm) this.pauseTimer();
  }

  puzzle: number[][] = [];
  userInput: CellInput[][] = [];
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
    { label: 'Hard', value: Difficulty.Hard },
  ];
  statsViewOrder: { key: Difficulty; label: string }[] = [
    { key: Difficulty.Easy, label: 'Easy' },
    { key: Difficulty.Medium, label: 'Medium' },
    { key: Difficulty.Hard, label: 'Hard' },
  ];

  constructor(
    private sudokuService: SudokuService,
    private statsService: StatsService,
    private gameStorageService: GameStorageService,
    private sudokuGameService: SudokuGameService,
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
    const isRetry = this.loadError;
    this.isLoading = true;
    this.loadError = false;
    this.clearTimer();
    this.selectedCell = null;
    this.grid?.clearSelection();
    this.sudokuService.getSudokuPuzzle(this.difficulty).subscribe({
      next: (data) => {
        if (isRetry) this.setUserMessage(MessageType.Welcome);
        this.isLoading = false;
        this.puzzle = data.puzzle;
        this.initializeUserInput();
        this.resetTimer();
        this.persistGameState();
      },
      error: () => {
        this.isLoading = false;
        this.loadError = true;
        this.userMessage = 'Unable to load a puzzle. Please try again.';
      },
    });
  }

  initializeUserInput(): void {
    this.userInput = this.sudokuGameService.createUserInput(this.puzzle);
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
    if (
      this.showDifficultyConfirm ||
      this.selectedDifficulty === this.difficulty
    ) {
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

    return (
      this.difficultyLevels.find((level) => level.value === difficulty)
        ?.label ?? difficulty
    );
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
    if (this.isCompleted) return;
    this.highlightErrors = true;

    const result = this.sudokuGameService.evaluateSolution(
      this.puzzle,
      this.userInput
    );

    this.incorrectCells = result.incorrectCells;
    this.incorrectRows = result.incorrectRows;
    this.incorrectCols = result.incorrectCols;
    this.incorrectBoxes = result.incorrectBoxes;

    if (result.isUntouched) {
      this.setUserMessage(MessageType.Welcome);
    } else if (result.isCorrect && result.cellsLeft > 0) {
      this.setUserMessage(MessageType.Progress, result.cellsLeft);
    } else if (!result.isCorrect) {
      this.setUserMessage(MessageType.Failure);
    } else if (result.isComplete) {
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
    return this.sudokuGameService.formatSeconds(totalSeconds);
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
    if (this.isCompleted) return;
    this.userInput = this.sudokuGameService.createUserInput(this.puzzle);
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
    this.stats = this.statsService.recordCompletion(
      this.difficulty,
      this.elapsedSeconds
    );
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
      incorrectBoxes: this.incorrectBoxes,
    };

    this.gameStorageService.save(gameState);
  }

  private normalizeCellValue(value: number | string | null): number | null {
    return this.sudokuGameService.normalizeCellValue(value);
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: KeyboardEvent): void {
    if (this.showStats) {
      event.preventDefault();
      this.toggleStats();
      return;
    }
    if (!this.showDifficultyConfirm) {
      return;
    }

    event.preventDefault();
    this.cancelDifficultyChange();
  }

  @HostListener('document:keydown.tab', ['$event'])
  @HostListener('document:keydown.shift.tab', ['$event'])
  onDialogTab(event: KeyboardEvent): void {
    if (!this.dialogElement) return;
    const buttons = this.dialogElement.querySelectorAll<HTMLElement>(
      'button:not(:disabled)'
    );
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (
      event.shiftKey &&
      (document.activeElement === first ||
        document.activeElement === this.dialogElement)
    ) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
}
