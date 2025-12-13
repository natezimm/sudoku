using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Diagnostics.CodeAnalysis;

public static class Program
{
    [ExcludeFromCodeCoverage]
    public static void Main(string[] args)
    {
        var app = Run(args);

        if (!AppContext.TryGetSwitch("SkipAppRun", out bool skip) || !skip)
        {
            app.Run();
        }
    }

    public static WebApplication Run(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        var clientUrl = SudokuApp.GetClientUrl(builder.Configuration);
        return SudokuApp.Create(builder, clientUrl);
    }
}

public static class SudokuApp
{
    public static string GetClientUrl(IConfiguration configuration)
    {
        var clientUrl = configuration["ClientUrl"];
        if (string.IsNullOrWhiteSpace(clientUrl))
        {
            throw new InvalidOperationException("ClientUrl is not configured.");
        }

        return clientUrl;
    }

    public static void ConfigureCors(CorsOptions options, string clientUrl)
    {
        options.AddPolicy("AllowClient",
            policy => policy.WithOrigins(clientUrl)
                            .AllowAnyMethod()
                            .AllowAnyHeader());
    }

    public static WebApplication Create(WebApplicationBuilder builder, string clientUrl)
    {
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        builder.Services.AddCors(options => ConfigureCors(options, clientUrl));

        var app = builder.Build();

        app.UseCors("AllowClient");

        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseHttpsRedirection();

        var sudokuEndpoint = app.MapGet("/api/sudoku", SudokuApp.GetPuzzleEndpoint);
        DecorateSudokuEndpoint(sudokuEndpoint);

        return app;
    }

    public static SudokuPuzzle BuildPuzzleResponse(string difficulty)
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

        return new SudokuPuzzle
        {
            Puzzle = jaggedPuzzle,
            Difficulty = difficulty
        };
    }

    public static SudokuPuzzle GetPuzzleEndpoint([FromQuery] string difficulty = "easy")
    {
        return BuildPuzzleResponse(difficulty);
    }

    [ExcludeFromCodeCoverage]
    private static void DecorateSudokuEndpoint(RouteHandlerBuilder endpoint)
    {
        endpoint.WithName("GetSudokuPuzzle");
        endpoint.WithOpenApi();
    }
}
