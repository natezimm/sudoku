using System.Collections.Generic;
using System.Linq;
using Xunit;

public class SudokuGeneratorTests
{
    [Fact]
    public void GeneratePuzzle_FullGridContainsEachNumberPerRowAndColumn()
    {
        var generator = new SudokuGenerator(new Random(100));
        var puzzle = generator.GeneratePuzzle(0);

        Assert.Equal(9, puzzle.GetLength(0));
        Assert.Equal(9, puzzle.GetLength(1));

        IEnumerable<int> expectedNumbers = Enumerable.Range(1, 9);

        for (int row = 0; row < 9; row++)
        {
            var rowNumbers = new HashSet<int>();
            for (int col = 0; col < 9; col++)
            {
                int value = puzzle[row, col];
                Assert.InRange(value, 1, 9);
                rowNumbers.Add(value);
            }
            Assert.Equal(9, rowNumbers.Count);
            Assert.All(expectedNumbers, expected => Assert.Contains(expected, rowNumbers));
        }

        for (int col = 0; col < 9; col++)
        {
            var colNumbers = new HashSet<int>();
            for (int row = 0; row < 9; row++)
            {
                colNumbers.Add(puzzle[row, col]);
            }
            Assert.Equal(9, colNumbers.Count);
            Assert.All(expectedNumbers, expected => Assert.Contains(expected, colNumbers));
        }

        for (int boxRow = 0; boxRow < 9; boxRow += 3)
        {
            for (int boxCol = 0; boxCol < 9; boxCol += 3)
            {
                var boxNumbers = new HashSet<int>();
                for (int row = boxRow; row < boxRow + 3; row++)
                {
                    for (int col = boxCol; col < boxCol + 3; col++)
                    {
                        boxNumbers.Add(puzzle[row, col]);
                    }
                }

                Assert.Equal(9, boxNumbers.Count);
                Assert.All(expectedNumbers, expected => Assert.Contains(expected, boxNumbers));
            }
        }
    }

    [Theory]
    [InlineData(0)]
    [InlineData(45)]
    [InlineData(51)]
    [InlineData(55)]
    public void GeneratePuzzle_RemovesExpectedNumberOfCellsAndKeepsUniqueSolution(int cellsToRemove)
    {
        var generator = new SudokuGenerator(new Random(cellsToRemove + 1));
        var puzzle = generator.GeneratePuzzle(cellsToRemove);

        int zeros = 0;
        for (int row = 0; row < 9; row++)
        {
            for (int col = 0; col < 9; col++)
            {
                int value = puzzle[row, col];
                if (value == 0)
                {
                    zeros++;
                }
                else
                {
                    Assert.InRange(value, 1, 9);
                }
            }
        }

        Assert.Equal(cellsToRemove, zeros);
        Assert.True(generator.HasUniqueSolution(puzzle));
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(65)]
    [InlineData(81)]
    public void GeneratePuzzle_RejectsUnsupportedRemovalCounts(int cellsToRemove)
    {
        var generator = new SudokuGenerator();

        Assert.Throws<ArgumentOutOfRangeException>(() => generator.GeneratePuzzle(cellsToRemove));
    }

    [Fact]
    public void CountSolutions_StopsAtRequestedLimit()
    {
        var generator = new SudokuGenerator(new Random(200));
        var emptyPuzzle = new int[9, 9];

        int solutions = generator.CountSolutions(emptyPuzzle, limit: 2);

        Assert.Equal(2, solutions);
    }

    [Fact]
    public void CountSolutions_ReturnsZeroForInvalidFilledGrid()
    {
        var generator = new SudokuGenerator(new Random(300));
        var puzzle = generator.GenerateSolvedGrid();
        puzzle[0, 0] = puzzle[0, 1];

        int solutions = generator.CountSolutions(puzzle);

        Assert.Equal(0, solutions);
        Assert.False(generator.HasUniqueSolution(puzzle));
    }
}
