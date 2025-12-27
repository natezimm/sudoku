using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Configuration;
using System.Diagnostics.CodeAnalysis;
using System.Threading.RateLimiting;

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

    /// <summary>
    /// Configures rate limiting to prevent DoS attacks and API abuse.
    /// </summary>
    public static void ConfigureRateLimiting(RateLimiterOptions options)
    {
        options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    AutoReplenishment = true,
                    PermitLimit = 60,
                    QueueLimit = 0,
                    Window = TimeSpan.FromMinutes(1)
                }));

        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    }

    /// <summary>
    /// Adds security headers to all responses for defense-in-depth.
    /// </summary>
    [ExcludeFromCodeCoverage]
    public static void UseSecurityHeaders(IApplicationBuilder app)
    {
        app.Use(async (context, next) =>
        {
            var headers = context.Response.Headers;
            
            // Prevent MIME type sniffing
            headers["X-Content-Type-Options"] = "nosniff";
            
            // Prevent clickjacking
            headers["X-Frame-Options"] = "DENY";
            
            // Control referrer information
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
            
            // Disable unnecessary browser features
            headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()";
            
            // Content Security Policy for API responses
            headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'";
            
            await next();
        });
    }

    /// <summary>
    /// Validates that the difficulty parameter is one of the allowed values.
    /// Returns null if valid, or an error message if invalid.
    /// </summary>
    public static string? ValidateDifficulty(string difficulty)
    {
        var allowedDifficulties = new[] { "easy", "medium", "hard" };
        if (!allowedDifficulties.Contains(difficulty.ToLower()))
        {
            return $"Invalid difficulty. Allowed values: {string.Join(", ", allowedDifficulties)}";
        }
        return null;
    }

    public static WebApplication Create(WebApplicationBuilder builder, string clientUrl)
    {
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        builder.Services.AddCors(options => ConfigureCors(options, clientUrl));
        builder.Services.AddRateLimiter(ConfigureRateLimiting);

        var app = builder.Build();

        // Security headers should be applied early in the pipeline
        UseSecurityHeaders(app);

        app.UseCors("AllowClient");
        app.UseRateLimiter();

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
            _ => 45         // Default to easy (validation should prevent reaching this)
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
            Difficulty = difficulty.ToLower()
        };
    }

    public static IResult GetPuzzleEndpoint([FromQuery] string difficulty = "easy")
    {
        var validationError = ValidateDifficulty(difficulty);
        if (validationError != null)
        {
            return Results.BadRequest(new { error = validationError });
        }
        
        return Results.Ok(BuildPuzzleResponse(difficulty));
    }

    [ExcludeFromCodeCoverage]
    private static void DecorateSudokuEndpoint(RouteHandlerBuilder endpoint)
    {
        endpoint.WithName("GetSudokuPuzzle");
        endpoint.WithOpenApi();
    }
}
