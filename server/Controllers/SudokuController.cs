using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/[controller]")]
public class SudokuController : ControllerBase
{
    private readonly SudokuGenerator _sudokuGenerator;

    public SudokuController(SudokuGenerator sudokuGenerator)
    {
        _sudokuGenerator = sudokuGenerator;
    }

    [HttpGet]
    public ActionResult<int[][]> GetSudokuPuzzle([FromQuery] string difficulty = "easy")
    {
        int cellsToRemove = difficulty.ToLower() switch
        {
            "easy" => 45,   // 81 - 36 filled
            "medium" => 51, // 81 - 30 filled
            "hard" => 55,   // 81 - 26 filled
            _ => 45         // Default to easy
        };

        var puzzle = _sudokuGenerator.GeneratePuzzle(cellsToRemove);
        int[][] jaggedPuzzle = new int[9][];
        for (int i = 0; i < 9; i++)
        {
            jaggedPuzzle[i] = new int[9];
            for (int j = 0; j < 9; j++)
            {
                jaggedPuzzle[i][j] = puzzle[i, j];
            }
        }
        return Ok(jaggedPuzzle);
    }
}