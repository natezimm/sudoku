var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Enable CORS to allow Angular app to connect to the API
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalhost",
        builder => builder.WithOrigins("http://localhost:4200")
                          .AllowAnyMethod()
                          .AllowAnyHeader());
});

var app = builder.Build();

// Apply the CORS policy globally
app.UseCors("AllowLocalhost");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.MapGet("/api/sudoku", () =>
{
    var generator = new SudokuGenerator();
    var puzzle = generator.GeneratePuzzle();

    // Convert the 2D array to a jagged array (int[][])
    int[][] jaggedPuzzle = new int[9][];
    for (int i = 0; i < 9; i++)
    {
        jaggedPuzzle[i] = new int[9];
        for (int j = 0; j < 9; j++)
        {
            jaggedPuzzle[i][j] = puzzle[i, j];
        }
    }

    return jaggedPuzzle;  // Return the jagged array
})
.WithName("GetSudokuPuzzle")
.WithOpenApi();

app.Run();