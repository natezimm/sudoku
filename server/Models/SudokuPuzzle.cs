public class SudokuPuzzle
{
    public int[][] Puzzle { get; set; } = Enumerable.Range(0, 9).Select(_ => new int[9]).ToArray();
    public string Difficulty { get; set; } = string.Empty;
}