public class SudokuGenerator
{
    private const int Size = 9;
    private const int BoxSize = 3;
    private const int MinimumCluesForUniquePuzzle = 17;
    private const int MaxGenerationAttempts = 40;

    private readonly Random _random;

    public SudokuGenerator(Random? random = null)
    {
        _random = random ?? Random.Shared;
    }

    public int[,] GeneratePuzzle(int cellsToRemove)
    {
        if (cellsToRemove < 0 || cellsToRemove > Size * Size - MinimumCluesForUniquePuzzle)
        {
            throw new ArgumentOutOfRangeException(
                nameof(cellsToRemove),
                $"cellsToRemove must be between 0 and {Size * Size - MinimumCluesForUniquePuzzle}.");
        }

        for (int attempt = 0; attempt < MaxGenerationAttempts; attempt++)
        {
            var puzzle = GenerateSolvedGrid();
            if (RemoveDigitsPreservingUniqueSolution(puzzle, cellsToRemove))
            {
                return puzzle;
            }
        }

        throw new InvalidOperationException("Unable to generate a unique Sudoku puzzle for the requested difficulty.");
    }

    public int[,] GenerateSolvedGrid()
    {
        int[,] puzzle = new int[Size, Size];
        FillDiagonal(puzzle);

        if (!FillRemaining(puzzle, 0, BoxSize))
        {
            throw new InvalidOperationException("Unable to generate a solved Sudoku grid.");
        }

        return puzzle;
    }

    public bool HasUniqueSolution(int[,] puzzle)
    {
        return CountSolutions(puzzle, 2) == 1;
    }

    public int CountSolutions(int[,] puzzle, int limit = 2)
    {
        if (limit < 1)
        {
            throw new ArgumentOutOfRangeException(nameof(limit), "Solution count limit must be at least 1.");
        }

        ValidateGridShape(puzzle);
        var workingGrid = CloneGrid(puzzle);
        if (!IsPartialGridValid(workingGrid))
        {
            return 0;
        }

        return CountSolutionsCore(workingGrid, limit);
    }

    private void FillDiagonal(int[,] puzzle)
    {
        for (int i = 0; i < Size; i += BoxSize)
        {
            FillBox(puzzle, i, i);
        }
    }

    private void FillBox(int[,] puzzle, int row, int col)
    {
        var numbers = ShuffledNumbers();
        int index = 0;

        for (int i = 0; i < BoxSize; i++)
        {
            for (int j = 0; j < BoxSize; j++)
            {
                puzzle[row + i, col + j] = numbers[index++];
            }
        }
    }

    private bool IsSafeInBox(int[,] puzzle, int row, int col, int num)
    {
        for (int i = 0; i < BoxSize; i++)
        {
            for (int j = 0; j < BoxSize; j++)
            {
                if (puzzle[row + i, col + j] == num)
                {
                    return false;
                }
            }
        }
        return true;
    }

    private bool IsSafe(int[,] puzzle, int row, int col, int num)
    {
        for (int x = 0; x < Size; x++)
        {
            if (puzzle[row, x] == num || puzzle[x, col] == num)
            {
                return false;
            }
        }
        return IsSafeInBox(puzzle, row - row % BoxSize, col - col % BoxSize, num);
    }

    private bool FillRemaining(int[,] puzzle, int i, int j)
    {
        if (j >= Size && i < Size - 1)
        {
            i++;
            j = 0;
        }

        if (i >= Size && j >= Size)
        {
            return true;
        }

        if (i < BoxSize)
        {
            if (j < BoxSize)
            {
                j = BoxSize;
            }
        }
        else if (i < Size - BoxSize)
        {
            if (j == i / BoxSize * BoxSize)
            {
                j += BoxSize;
            }
        }
        else
        {
            if (j == Size - BoxSize)
            {
                i++;
                j = 0;
                if (i >= Size)
                {
                    return true;
                }
            }
        }

        foreach (int num in ShuffledNumbers())
        {
            if (IsSafe(puzzle, i, j, num))
            {
                puzzle[i, j] = num;
                if (FillRemaining(puzzle, i, j + 1))
                {
                    return true;
                }
                puzzle[i, j] = 0;
            }
        }
        return false;
    }

    private bool RemoveDigitsPreservingUniqueSolution(int[,] puzzle, int count)
    {
        if (count == 0)
        {
            return true;
        }

        int removed = 0;
        foreach (int cellId in ShuffledCellIds())
        {
            int row = cellId / Size;
            int col = cellId % Size;
            int previousValue = puzzle[row, col];

            puzzle[row, col] = 0;
            if (HasUniqueSolution(puzzle))
            {
                removed++;
                if (removed == count)
                {
                    return true;
                }
            }
            else
            {
                puzzle[row, col] = previousValue;
            }
        }

        return removed == count;
    }

    private int CountSolutionsCore(int[,] puzzle, int limit)
    {
        var nextCell = FindBestEmptyCell(puzzle);
        if (nextCell is null)
        {
            return 1;
        }

        var (row, col, candidates) = nextCell.Value;
        if (candidates.Count == 0)
        {
            return 0;
        }

        int solutions = 0;
        foreach (int candidate in candidates)
        {
            puzzle[row, col] = candidate;
            solutions += CountSolutionsCore(puzzle, limit - solutions);
            puzzle[row, col] = 0;

            if (solutions >= limit)
            {
                return solutions;
            }
        }

        return solutions;
    }

    private (int Row, int Col, List<int> Candidates)? FindBestEmptyCell(int[,] puzzle)
    {
        (int Row, int Col, List<int> Candidates)? bestCell = null;

        for (int row = 0; row < Size; row++)
        {
            for (int col = 0; col < Size; col++)
            {
                if (puzzle[row, col] != 0)
                {
                    continue;
                }

                var candidates = GetCandidates(puzzle, row, col);
                if (bestCell is null || candidates.Count < bestCell.Value.Candidates.Count)
                {
                    bestCell = (row, col, candidates);
                    if (candidates.Count <= 1)
                    {
                        return bestCell;
                    }
                }
            }
        }

        return bestCell;
    }

    private List<int> GetCandidates(int[,] puzzle, int row, int col)
    {
        var candidates = new List<int>();
        for (int num = 1; num <= Size; num++)
        {
            if (IsSafe(puzzle, row, col, num))
            {
                candidates.Add(num);
            }
        }

        return candidates;
    }

    private bool IsPartialGridValid(int[,] puzzle)
    {
        for (int row = 0; row < Size; row++)
        {
            for (int col = 0; col < Size; col++)
            {
                int value = puzzle[row, col];
                if (value == 0)
                {
                    continue;
                }

                if (value < 1 || value > Size)
                {
                    return false;
                }

                puzzle[row, col] = 0;
                bool isValidPlacement = IsSafe(puzzle, row, col, value);
                puzzle[row, col] = value;

                if (!isValidPlacement)
                {
                    return false;
                }
            }
        }

        return true;
    }

    private int[] ShuffledNumbers()
    {
        var numbers = Enumerable.Range(1, Size).ToArray();
        Shuffle(numbers);
        return numbers;
    }

    private int[] ShuffledCellIds()
    {
        var cells = Enumerable.Range(0, Size * Size).ToArray();
        Shuffle(cells);
        return cells;
    }

    private void Shuffle<T>(T[] values)
    {
        for (int i = values.Length - 1; i > 0; i--)
        {
            int j = _random.Next(i + 1);
            (values[i], values[j]) = (values[j], values[i]);
        }
    }

    private static int[,] CloneGrid(int[,] puzzle)
    {
        var clone = new int[Size, Size];
        for (int row = 0; row < Size; row++)
        {
            for (int col = 0; col < Size; col++)
            {
                clone[row, col] = puzzle[row, col];
            }
        }

        return clone;
    }

    private static void ValidateGridShape(int[,] puzzle)
    {
        if (puzzle.GetLength(0) != Size || puzzle.GetLength(1) != Size)
        {
            throw new ArgumentException("Sudoku grid must be 9x9.", nameof(puzzle));
        }
    }
}
