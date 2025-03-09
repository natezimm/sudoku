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
    public ActionResult<int[][]> GetSudokuPuzzle()
    {
        var puzzle = _sudokuGenerator.GeneratePuzzle();
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