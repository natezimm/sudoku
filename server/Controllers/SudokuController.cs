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
    public ActionResult<object> GetSudokuPuzzle([FromQuery] string difficulty = "easy")
    {
        int cellsToRemove = difficulty.ToLower() switch
        {
            "easy" => 45,
            "medium" => 51,
            "hard" => 55,
            _ => 45
        };

        var (puzzle, solution) = _sudokuGenerator.GeneratePuzzleWithSolution(cellsToRemove);

        int[][] jaggedPuzzle = ConvertToJaggedArray(puzzle);
        int[][] jaggedSolution = ConvertToJaggedArray(solution);

        return Ok(new
        {
            Puzzle = jaggedPuzzle,
            Solution = jaggedSolution
        });
    }

    private int[][] ConvertToJaggedArray(int[,] array)
    {
        int[][] jaggedArray = new int[9][];
        for (int i = 0; i < 9; i++)
        {
            jaggedArray[i] = new int[9];
            for (int j = 0; j < 9; j++)
            {
                jaggedArray[i][j] = array[i, j];
            }
        }
        return jaggedArray;
    }
}