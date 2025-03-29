using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalhost",
        builder => builder.WithOrigins("http://localhost:4200")
                          .AllowAnyMethod()
                          .AllowAnyHeader());
});

var app = builder.Build();

app.UseCors("AllowLocalhost");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.MapGet("/api/sudoku", ([FromQuery] string difficulty = "easy") =>
{
    int cellsToRemove = difficulty.ToLower() switch
    {
        "easy" => 45,   // 81 - 36 filled
        "medium" => 51, // 81 - 30 filled
        "hard" => 55,   // 81 - 26 filled
        _ => 45         // Default to easy
    };

    var generator = new SudokuGenerator();
    var (puzzle, solution) = generator.GeneratePuzzleWithSolution(cellsToRemove);

    int[][] jaggedPuzzle = new int[9][];
    int[][] jaggedSolution = new int[9][];
    for (int i = 0; i < 9; i++)
    {
        jaggedPuzzle[i] = new int[9];
        jaggedSolution[i] = new int[9];
        for (int j = 0; j < 9; j++)
        {
            jaggedPuzzle[i][j] = puzzle[i, j];
            jaggedSolution[i][j] = solution[i, j];
        }
    }

    return new
    {
        Puzzle = jaggedPuzzle,
        Solution = jaggedSolution
    };
})
.WithName("GetSudokuPuzzle")
.WithOpenApi();

app.Run();