using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

var clientUrl = builder.Configuration["ClientUrl"] ?? throw new InvalidOperationException("ClientUrl is not configured.");

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowClient",
        builder => builder.WithOrigins(clientUrl)
                          .AllowAnyMethod()
                          .AllowAnyHeader());
});

var app = builder.Build();

app.UseCors("AllowClient");

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
    var puzzle = generator.GeneratePuzzle(cellsToRemove);

    int[][] jaggedPuzzle = new int[9][];
    for (int i = 0; i < 9; i++)
    {
        jaggedPuzzle[i] = new int[9];
        for (int j = 0; j < 9; j++)
        {
            jaggedPuzzle[i][j] = puzzle[i, j];
        }
    }

    return new
    {
        Puzzle = jaggedPuzzle,
    };
})
.WithName("GetSudokuPuzzle")
.WithOpenApi();

app.Run();