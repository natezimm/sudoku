using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Xunit;

public class SudokuControllerTests
{
    [Theory]
    [InlineData("easy", 45)]
    [InlineData("medium", 51)]
    [InlineData("hard", 55)]
    [InlineData("unknown", 45)]
    public void GetSudokuPuzzle_CoversDifficultyParameterMappings(string difficulty, int expectedZeros)
    {
        var controller = new SudokuController(new SudokuGenerator());
        var actionResult = controller.GetSudokuPuzzle(difficulty);
        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var puzzle = Assert.IsType<int[][]>(okResult.Value);

        Assert.Equal(9, puzzle.Length);
        Assert.All(puzzle, row => Assert.Equal(9, row.Length));

        int zeros = puzzle.SelectMany(row => row).Count(value => value == 0);
        Assert.Equal(expectedZeros, zeros);
    }

    [Fact]
    public void GetSudokuPuzzle_DefaultsToEasyDifficulty()
    {
        var controller = new SudokuController(new SudokuGenerator());
        var actionResult = controller.GetSudokuPuzzle();
        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var puzzle = Assert.IsType<int[][]>(okResult.Value);

        Assert.Equal(9, puzzle.Length);
        Assert.All(puzzle, row => Assert.Equal(9, row.Length));

        int zeros = puzzle.SelectMany(row => row).Count(value => value == 0);
        Assert.Equal(45, zeros);
    }
}
