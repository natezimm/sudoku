using System;

public class SudokuGenerator
{
    private static Random random = new Random();

    public (int[,], int[,]) GeneratePuzzleWithSolution(int cellsToRemove)
    {
        int[,] puzzle = new int[9, 9];
        FillDiagonal(puzzle);
        FillRemaining(puzzle, 0, 3);

        int[,] solution = (int[,])puzzle.Clone();

        RemoveDigits(puzzle, cellsToRemove);

        return (puzzle, solution);
    }

    private void FillDiagonal(int[,] puzzle)
    {
        for (int i = 0; i < 9; i += 3)
        {
            FillBox(puzzle, i, i);
        }
    }

    private void FillBox(int[,] puzzle, int row, int col)
    {
        int num;
        for (int i = 0; i < 3; i++)
        {
            for (int j = 0; j < 3; j++)
            {
                do
                {
                    num = random.Next(1, 10);
                } while (!IsSafeInBox(puzzle, row, col, num));

                puzzle[row + i, col + j] = num;
            }
        }
    }

    private bool IsSafeInBox(int[,] puzzle, int row, int col, int num)
    {
        for (int i = 0; i < 3; i++)
        {
            for (int j = 0; j < 3; j++)
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
        for (int x = 0; x < 9; x++)
        {
            if (puzzle[row, x] == num || puzzle[x, col] == num)
            {
                return false;
            }
        }
        return IsSafeInBox(puzzle, row - row % 3, col - col % 3, num);
    }

    private bool FillRemaining(int[,] puzzle, int i, int j)
    {
        if (j >= 9 && i < 8)
        {
            i++;
            j = 0;
        }
        if (i >= 9 && j >= 9)
        {
            return true;
        }
        if (i < 3)
        {
            if (j < 3)
            {
                j = 3;
            }
        }
        else if (i < 6)
        {
            if (j == (int)(i / 3) * 3)
            {
                j += 3;
            }
        }
        else
        {
            if (j == 6)
            {
                i++;
                j = 0;
                if (i >= 9)
                {
                    return true;
                }
            }
        }

        for (int num = 1; num <= 9; num++)
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

    private void RemoveDigits(int[,] puzzle, int count)
    {
        while (count != 0)
        {
            int cellId = random.Next(0, 81);
            int i = cellId / 9;
            int j = cellId % 9;
            if (puzzle[i, j] != 0)
            {
                count--;
                puzzle[i, j] = 0;
            }
        }
    }
}