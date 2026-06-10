import { SudokuGameService } from './sudoku-game.service';

const solutionGrid: number[][] = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

describe('SudokuGameService', () => {
  let service: SudokuGameService;

  beforeEach(() => {
    service = new SudokuGameService();
  });

  it('creates editable input only for empty puzzle cells', () => {
    const puzzle = [[0, 2, 0, 4, 5, 6, 7, 8, 9], ...solutionGrid.slice(1)];

    const input = service.createUserInput(puzzle);

    expect(input[0][0]).toBeNull();
    expect(input[0][1]).toBe(2);
    expect(input[0][2]).toBeNull();
  });

  it('evaluates complete valid grids as solved', () => {
    const puzzle = solutionGrid.map((row) => row.map(() => 0));
    const result = service.evaluateSolution(puzzle, solutionGrid);

    expect(result.isCorrect).toBeTrue();
    expect(result.isComplete).toBeTrue();
    expect(result.cellsLeft).toBe(0);
    expect(result.incorrectCells).toEqual([]);
  });

  it('flags invalid values and duplicate conflicts', () => {
    const puzzle = solutionGrid.map((row) => row.map(() => 0));
    const userInput = service.createUserInput(puzzle);
    userInput[0][0] = 1;
    userInput[0][1] = 1;
    userInput[1][0] = 1;
    userInput[0][2] = 'x';

    const result = service.evaluateSolution(puzzle, userInput);

    expect(result.isCorrect).toBeFalse();
    expect(result.isComplete).toBeFalse();
    expect(result.incorrectCells).toContain(
      jasmine.objectContaining({ row: 0, col: 2 })
    );
    expect(result.incorrectRows[0]).toBeTrue();
    expect(result.incorrectCols[0]).toBeTrue();
    expect(result.incorrectBoxes[0]).toBeTrue();
  });

  it('formats elapsed seconds for display', () => {
    expect(service.formatSeconds(null)).toBe('--:--');
    expect(service.formatSeconds(5)).toBe('00:05');
    expect(service.formatSeconds(65)).toBe('01:05');
  });
});
