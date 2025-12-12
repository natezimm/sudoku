using Xunit;

public class SudokuPuzzleTests
{
    [Fact]
    public void Properties_DefaultsAndMutationWork()
    {
        var puzzle = new SudokuPuzzle();

        Assert.Equal(9, puzzle.Puzzle.Length);
        Assert.All(puzzle.Puzzle, row => Assert.Equal(9, row.Length));
        Assert.Equal(string.Empty, puzzle.Difficulty);

        puzzle.Puzzle[0][0] = 7;
        puzzle.Difficulty = "hard";

        Assert.Equal(7, puzzle.Puzzle[0][0]);
        Assert.Equal("hard", puzzle.Difficulty);
    }
}
