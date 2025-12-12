import { GameStorageService, SavedGameState } from './game-storage.service';
import { Difficulty } from './sudoku.interface';

const buildGrid = (fillValue: number | null = 0): any[][] =>
  Array.from({ length: 9 }, () => Array(9).fill(fillValue));

const validState: SavedGameState = {
  puzzle: buildGrid(1) as number[][],
  userInput: (() => {
    const grid = buildGrid(null);
    grid[0][0] = '1';
    return grid;
  })(),
  difficulty: Difficulty.Medium,
  elapsedSeconds: 42,
  isPaused: false,
  highlightErrors: false,
  userMessage: 'test',
  incorrectCells: [{ row: 1, col: 1 }],
  incorrectRows: Array(9).fill(false),
  incorrectCols: Array(9).fill(false),
  incorrectBoxes: Array(9).fill(false)
};

describe('GameStorageService', () => {
  let service: GameStorageService;

  beforeEach(() => {
    localStorage.clear();
    service = new GameStorageService();
  });

  it('saves, loads, and clones a valid state', () => {
    service.save(validState);

    const loaded = service.load();
    expect(loaded).not.toBeNull();
    expect(loaded).toEqual(validState);
    expect(loaded).not.toBe(validState);
    expect(loaded?.puzzle).not.toBe(validState.puzzle);
    expect(loaded?.userInput).not.toBe(validState.userInput);
    expect(loaded?.incorrectCells[0]).not.toBe(validState.incorrectCells[0]);
  });

  it('clears stored game data', () => {
    service.save(validState);
    service.clear();
    expect(service.load()).toBeNull();
  });

  it('returns null when data is invalid or cannot be parsed', () => {
    localStorage.setItem('sudokuActiveGame', 'not-json');
    expect(service.load()).toBeNull();

    const malformed: Partial<SavedGameState> = {
      ...validState,
      puzzle: [[1, 2]] as any
    };
    service.save(malformed as SavedGameState);
    expect(service.load()).toBeNull();
  });

  it('rejects invalid cells when strings are not allowed', () => {
    const puzzleWithString = buildGrid(1) as any;
    puzzleWithString[0][0] = 'bad';

    const badState: SavedGameState = {
      ...validState,
      puzzle: puzzleWithString,
      userInput: Array.from({ length: 9 }, () => Array(9).fill('toolong')) as any
    };

    service.save(badState);
    expect(service.load()).toBeNull();
  });

  it('fills missing boolean rows with defaults while cloning', () => {
    const partialState: SavedGameState = {
      ...validState,
      incorrectRows: [] as any,
      incorrectCols: undefined as any,
      incorrectBoxes: undefined as any
    };

    service.save(partialState);
    const loaded = service.load();
    expect(loaded?.incorrectRows).toEqual(Array(9).fill(false));
    expect(loaded?.incorrectCols).toEqual(Array(9).fill(false));
    expect(loaded?.incorrectBoxes).toEqual(Array(9).fill(false));
  });
});
