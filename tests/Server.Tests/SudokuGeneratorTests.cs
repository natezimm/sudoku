using System.Collections.Generic;
using System.Linq;
using Xunit;

public class SudokuGeneratorTests
{
    [Fact]
    public void GeneratePuzzle_FullGridContainsEachNumberPerRowAndColumn()
    {
        var generator = new SudokuGenerator();
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
    }

    [Theory]
    [InlineData(0)]
    [InlineData(45)]
    [InlineData(51)]
    [InlineData(55)]
    [InlineData(81)]
    public void GeneratePuzzle_RemovesExpectedNumberOfCells(int cellsToRemove)
    {
        var generator = new SudokuGenerator();
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
    }
}
