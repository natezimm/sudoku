import { fakeAsync, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { SavedGameState } from './game-storage.service';

import { SudokuComponent } from './sudoku.component';
import { Difficulty, MessageType } from './sudoku.interface';
import { SudokuStats } from './stats.service';

const solutionGrid: number[][] = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9]
];

const puzzleWith45Holes = solutionGrid.map((row, rowIndex) =>
  row.map(cell => (rowIndex < 5 ? 0 : cell))
);

class SudokuServiceStub {
  puzzleResponse = { puzzle: puzzleWith45Holes };
  getSudokuPuzzle = jasmine.createSpy('getSudokuPuzzle').and.callFake(() => of(this.puzzleResponse));
}

class StatsServiceStub {
  stats: SudokuStats = {
    [Difficulty.Easy]: { gamesCompleted: 0, fastestTime: null },
    [Difficulty.Medium]: { gamesCompleted: 0, fastestTime: null },
    [Difficulty.Hard]: { gamesCompleted: 0, fastestTime: null }
  };

  getStats = jasmine.createSpy('getStats').and.callFake(() => ({ ...this.stats }));

  recordCompletion = jasmine.createSpy('recordCompletion').and.callFake(
    (difficulty: Difficulty, elapsedSeconds: number) => {
      const current = this.stats[difficulty];
      const fastest =
        current.fastestTime === null
          ? elapsedSeconds
          : Math.min(current.fastestTime, elapsedSeconds);

      this.stats = {
        ...this.stats,
        [difficulty]: {
          gamesCompleted: current.gamesCompleted + 1,
          fastestTime: fastest
        }
      };

      return { ...this.stats };
    }
  );
}

class GameStorageServiceStub {
  save = jasmine.createSpy('save');
  load = jasmine.createSpy('load').and.returnValue(null);
  clear = jasmine.createSpy('clear');
}

describe('SudokuComponent', () => {
  let sudokuService: SudokuServiceStub;
  let statsService: StatsServiceStub;
  let gameStorageService: GameStorageServiceStub;
  let component: SudokuComponent;

  beforeEach(() => {
    sudokuService = new SudokuServiceStub();
    statsService = new StatsServiceStub();
    gameStorageService = new GameStorageServiceStub();
    component = new SudokuComponent(
      sudokuService as any,
      statsService as any,
      gameStorageService as any
    );
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('initializes a new game when no saved state exists', fakeAsync(() => {
    component.ngOnInit();
    tick();

    expect(component.showResumePrompt).toBeFalse();
    expect(component.resumeCandidate).toBeNull();
    expect(component.userMessage).toContain('Welcome');
    expect(component.puzzle.length).toBe(9);
    expect(gameStorageService.clear).toHaveBeenCalled();
    expect(gameStorageService.save).toHaveBeenCalled();

    tick(1000);
    expect(component.elapsedSeconds).toBeGreaterThan(0);
  }));

  it('shows a resume prompt when a saved game exists', () => {
    const savedState: SavedGameState = {
      puzzle: puzzleWith45Holes,
      userInput: puzzleWith45Holes.map(row => row.map(cell => (cell === 0 ? null : cell))),
      difficulty: Difficulty.Hard,
      elapsedSeconds: 15,
      isPaused: true,
      highlightErrors: true,
      userMessage: 'resume me',
      incorrectCells: [{ row: 0, col: 0 }],
      incorrectRows: Array(9).fill(false),
      incorrectCols: Array(9).fill(false),
      incorrectBoxes: Array(9).fill(false)
    };
    gameStorageService.load.and.returnValue(savedState);

    component.ngOnInit();

    expect(component.resumeCandidate).toEqual(savedState);
    expect(component.showResumePrompt).toBeTrue();
    expect(component.userMessage).toContain('Resume your previous puzzle');
    expect(sudokuService.getSudokuPuzzle).not.toHaveBeenCalled();
  });

  it('resumes a saved game and restarts the timer when not paused', fakeAsync(() => {
    const savedState: SavedGameState = {
      puzzle: puzzleWith45Holes,
      userInput: puzzleWith45Holes.map(row => row.map(cell => (cell === 0 ? null : cell))),
      difficulty: Difficulty.Medium,
      elapsedSeconds: 5,
      isPaused: false,
      highlightErrors: false,
      userMessage: 'Resume',
      incorrectCells: [],
      incorrectRows: Array(9).fill(false),
      incorrectCols: Array(9).fill(false),
      incorrectBoxes: Array(9).fill(false)
    };

    component.resumeCandidate = savedState;
    component.showResumePrompt = true;
    component.resumeSavedGame();
    tick(1000);

    expect(component.puzzle).toEqual(savedState.puzzle);
    expect(component.userInput).toEqual(savedState.userInput);
    expect(component.difficulty).toBe(savedState.difficulty);
    expect(component.isPaused).toBeFalse();
    expect(component.showResumePrompt).toBeFalse();
    expect(component.resumeCandidate).toBeNull();
    expect(component.elapsedSeconds).toBeGreaterThan(savedState.elapsedSeconds);
    expect(gameStorageService.save).toHaveBeenCalled();
  }));

  it('persists state without restarting the timer when resuming a paused game', () => {
    const savedState: SavedGameState = {
      puzzle: puzzleWith45Holes,
      userInput: puzzleWith45Holes.map(row => row.map(cell => (cell === 0 ? null : cell))),
      difficulty: Difficulty.Easy,
      elapsedSeconds: 12,
      isPaused: true,
      highlightErrors: true,
      userMessage: 'Paused game',
      incorrectCells: [],
      incorrectRows: Array(9).fill(false),
      incorrectCols: Array(9).fill(false),
      incorrectBoxes: Array(9).fill(false)
    };

    const persistSpy = spyOn<any>(component, 'persistGameState').and.callThrough();
    const startSpy = spyOn<any>(component, 'startTimer').and.callThrough();

    component.resumeCandidate = savedState;
    component.resumeSavedGame();

    expect(component.isPaused).toBeTrue();
    expect(startSpy).not.toHaveBeenCalled();
    expect(persistSpy).toHaveBeenCalled();
    expect(component.showResumePrompt).toBeFalse();
  });

  it('starts a new game when there is no resume candidate', () => {
    const startSpy = spyOn(component, 'startNewGame');
    component.resumeCandidate = null;

    component.resumeSavedGame();

    expect(startSpy).toHaveBeenCalled();
  });

  it('prompts before starting a new puzzle when difficulty changes', () => {
    const fetchSpy = spyOn(component, 'fetchPuzzle').and.stub();

    component.selectedDifficulty = Difficulty.Hard;
    component.onDifficultyChange();

    expect(component.showDifficultyConfirm).toBeTrue();
    expect(component.pendingDifficulty).toBe(Difficulty.Hard);
    expect(component.difficulty).toBe(Difficulty.Easy);
    expect(gameStorageService.clear).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();

    component.confirmDifficultyChange();

    expect(component.showDifficultyConfirm).toBeFalse();
    expect(component.difficulty).toBe(Difficulty.Hard);
    expect(component.selectedDifficulty).toBe(Difficulty.Hard);
    expect(gameStorageService.clear).toHaveBeenCalled();
    expect(component.userMessage).toContain('Difficulty changed to hard');
    expect(fetchSpy).toHaveBeenCalled();
  });

  it('cancels the difficulty change and restores the previous selection', () => {
    component.selectedDifficulty = Difficulty.Medium;
    component.onDifficultyChange();

    component.cancelDifficultyChange();

    expect(component.showDifficultyConfirm).toBeFalse();
    expect(component.difficulty).toBe(Difficulty.Easy);
    expect(component.selectedDifficulty).toBe(Difficulty.Easy);
  });

  it('shows welcome message when the board is untouched', () => {
    component.puzzle = Array.from({ length: 9 }, () => Array(9).fill(0));
    component.initializeUserInput();
    gameStorageService.save.calls.reset();

    component.checkSolution();

    expect(component.userMessage).toContain('Welcome');
    expect(component.highlightErrors).toBeTrue();
    expect(component.incorrectCells.length).toBe(0);
    expect(gameStorageService.save).toHaveBeenCalled();
  });

  it('flags invalid entries and conflicts', () => {
    component.puzzle = Array.from({ length: 9 }, () => Array(9).fill(0));
    component.userInput = Array.from({ length: 9 }, () => Array(9).fill(null));
    component.userInput[0][0] = 1;
    component.userInput[0][1] = 1;
    component.userInput[1][0] = 1;
    component.userInput[1][1] = 1;
    component.userInput[0][2] = 'x' as any;

    component.checkSolution();

    expect(component.userMessage).toContain('Oops!');
    expect(component.incorrectCells).toContain(jasmine.objectContaining({ row: 0, col: 0 }));
    expect(component.incorrectCells).toContain(jasmine.objectContaining({ row: 0, col: 2 }));
    expect(component.incorrectRows[0]).toBeTrue();
    expect(component.incorrectCols[0]).toBeTrue();
    expect(component.incorrectBoxes[0]).toBeTrue();
    expect(component.highlightErrors).toBeTrue();
  });

  it('shows progress when some cells are correct but incomplete', () => {
    component.puzzle = puzzleWith45Holes;
    component.initializeUserInput();
    component.userInput[0] = [...solutionGrid[0]];
    component.userInput[1][0] = solutionGrid[1][0];

    component.checkSolution();

    expect(component.userMessage).toContain('still 35 to go');
    expect(component.isCompleted).toBeFalse();
  });

  it('handles successful completion by updating stats and clearing storage', () => {
    component.puzzle = puzzleWith45Holes;
    component.userInput = solutionGrid.map(row => [...row]);
    component.elapsedSeconds = 10;
    component['timerId'] = setInterval(() => {}, 1000) as any;
    gameStorageService.save.calls.reset();

    component.checkSolution();

    expect(component.isCompleted).toBeTrue();
    expect(component.isPaused).toBeFalse();
    expect(statsService.recordCompletion).toHaveBeenCalledWith(Difficulty.Easy, 10);
    expect(component.stats[Difficulty.Easy].gamesCompleted).toBe(1);
    expect(component.userMessage).toContain('Great job');
    expect(gameStorageService.clear).toHaveBeenCalled();
    expect(gameStorageService.save).not.toHaveBeenCalled();
    expect(component['timerId']).toBeNull();
  });

  it('starts, pauses, and resumes the timer as expected', fakeAsync(() => {
    component.puzzle = puzzleWith45Holes;
    component.userInput = puzzleWith45Holes.map(row => row.map(cell => (cell === 0 ? null : cell)));

    (component as any).startTimer();
    tick(1000);
    expect(component.elapsedSeconds).toBe(1);

    component.pauseTimer();
    expect(component.isPaused).toBeTrue();

    component['timerId'] = {} as any;
    const startSpy = spyOn<any>(component, 'startTimer').and.stub();
    component.resumeTimer();
    expect(startSpy).not.toHaveBeenCalled();

    component['timerId'] = null;
    component.resumeTimer();
    expect(startSpy).toHaveBeenCalled();
  }));

  it('stops early when attempting to start a timer for a completed game', () => {
    component.isCompleted = true;
    (component as any).startTimer();

    expect(component['timerId']).toBeNull();
  });

  it('clears user input, errors, and saves progress', () => {
    component.puzzle = puzzleWith45Holes;
    component.userInput = puzzleWith45Holes.map(row => row.map(cell => (cell === 0 ? 5 : cell)));
    component.incorrectCells = [{ row: 0, col: 0 }];
    component.incorrectRows[0] = true;
    component.highlightErrors = true;

    component.clearUserInput();

    expect(component.userInput[0][0]).toBeNull();
    expect(component.userInput[8][8]).toBe(solutionGrid[8][8]);
    expect(component.highlightErrors).toBeFalse();
    expect(component.incorrectCells.length).toBe(0);
    expect(component.userMessage).toContain('cleared');
    expect(gameStorageService.save).toHaveBeenCalled();
  });

  it('persists cell changes immediately', () => {
    component.puzzle = puzzleWith45Holes;
    component.userInput = puzzleWith45Holes;
    gameStorageService.save.calls.reset();

    component.onCellInputChange();

    expect(gameStorageService.save).toHaveBeenCalled();
  });

  it('toggles highlighting and either checks the solution or resets errors', () => {
    component.puzzle = puzzleWith45Holes;
    component.userInput = puzzleWith45Holes;
    const checkSpy = spyOn(component, 'checkSolution').and.stub();

    component.toggleHighlighting();
    expect(component.highlightErrors).toBeTrue();
    expect(checkSpy).toHaveBeenCalled();

    component.incorrectCells = [{ row: 1, col: 1 }];
    component.incorrectRows[1] = true;
    component.incorrectCols[1] = true;
    component.incorrectBoxes[1] = true;

    component.toggleHighlighting();
    expect(component.highlightErrors).toBeFalse();
    expect(component.incorrectCells.length).toBe(0);
    expect(component.incorrectRows.every(val => val === false)).toBeTrue();
    expect(component.incorrectCols.every(val => val === false)).toBeTrue();
    expect(component.incorrectBoxes.every(val => val === false)).toBeTrue();
  });

  it('toggles stats visibility', () => {
    expect(component.showStats).toBeFalse();
    component.toggleStats();
    expect(component.showStats).toBeTrue();
  });

  it('skips persisting when the game is completed or data is missing', () => {
    component.puzzle = [];
    component.userInput = [];
    gameStorageService.save.calls.reset();
    (component as any).persistGameState();
    expect(gameStorageService.save).not.toHaveBeenCalled();

    component.puzzle = puzzleWith45Holes;
    component.userInput = puzzleWith45Holes;
    component.isCompleted = true;
    (component as any).persistGameState();
    expect(gameStorageService.save).not.toHaveBeenCalled();

    component.isCompleted = false;
    (component as any).persistGameState();
    expect(gameStorageService.save).toHaveBeenCalled();
  });

  it('formats time correctly and normalizes inputs', () => {
    component.elapsedSeconds = 65;
    expect(component.formatTime()).toBe('01:05');
    expect(component.formatSeconds(null)).toBe('--:--');
    expect(component.formatSeconds(5)).toBe('00:05');
    expect((component as any).normalizeCellValue(null)).toBeNull();
    expect((component as any).normalizeCellValue('')).toBeNull();
    expect((component as any).normalizeCellValue('5')).toBe(5);
    expect((component as any).normalizeCellValue(9)).toBe(9);
    expect((component as any).normalizeCellValue(0)).toBeNull();
    expect((component as any).normalizeCellValue(10)).toBeNull();
    expect((component as any).normalizeCellValue('x')).toBeNull();
  });

  it('handles toggleTimer by delegating to pause or resume', () => {
    const pauseSpy = spyOn(component, 'pauseTimer').and.callThrough();
    const resumeSpy = spyOn(component, 'resumeTimer').and.callThrough();

    component.isPaused = false;
    component.toggleTimer();
    expect(pauseSpy).toHaveBeenCalled();

    component.isPaused = true;
    component.toggleTimer();
    expect(resumeSpy).toHaveBeenCalled();
  });

  it('sets fallback messages for unknown message types', () => {
    (component as any).setUserMessage(MessageType.Unknown);
    expect(component.userMessage).toBe('An unknown action occurred.');
  });

  it('uses default collections and message when saved game data omits them', () => {
    const savedState: SavedGameState = {
      puzzle: puzzleWith45Holes,
      userInput: puzzleWith45Holes.map(row => row.map(cell => (cell === 0 ? null : cell))),
      difficulty: Difficulty.Medium,
      elapsedSeconds: 5,
      isPaused: true,
      highlightErrors: true,
      userMessage: '',
      incorrectCells: undefined as any,
      incorrectRows: undefined as any,
      incorrectCols: undefined as any,
      incorrectBoxes: undefined as any
    };

    component.resumeCandidate = savedState;
    component.showResumePrompt = true;

    component.resumeSavedGame();

    expect(component.userMessage).toBe('Resuming your saved puzzle.');
    expect(component.incorrectCells).toEqual([]);
    expect(component.incorrectRows).toEqual(Array(9).fill(false));
    expect(component.incorrectCols).toEqual(Array(9).fill(false));
    expect(component.incorrectBoxes).toEqual(Array(9).fill(false));
  });
});
