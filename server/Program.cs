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

        if (!Uri.TryCreate(clientUrl, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            throw new InvalidOperationException("ClientUrl must be an absolute HTTP or HTTPS URL.");
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

    [ExcludeFromCodeCoverage]
    public static void UseSecurityHeaders(IApplicationBuilder app)
    {
        app.Use(async (context, next) =>
        {
            var headers = context.Response.Headers;
            headers["X-Content-Type-Options"] = "nosniff";
            headers["X-Frame-Options"] = "DENY";
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
            headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()";
            headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'";
            
            await next();
        });
    }

    public static string? ValidateDifficulty(string? difficulty)
    {
        if (!SudokuDifficulty.TryNormalize(difficulty, out _))
        {
            return $"Invalid difficulty. Allowed values: {string.Join(", ", SudokuDifficulty.AllowedValues)}";
        }
        return null;
    }

    public static WebApplication Create(WebApplicationBuilder builder, string clientUrl)
    {
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        builder.Services.AddTransient<SudokuGenerator>();
        builder.Services.AddCors(options => ConfigureCors(options, clientUrl));
        builder.Services.AddRateLimiter(ConfigureRateLimiting);

        var app = builder.Build();

        UseSecurityHeaders(app);

        if (!app.Environment.IsDevelopment())
        {
            app.UseHsts();
        }

        app.UseCors("AllowClient");
        app.UseRateLimiter();

        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseHttpsRedirection();

        var healthEndpoint = app.MapGet("/api/health", SudokuApp.GetHealthEndpoint);
        DecorateHealthEndpoint(healthEndpoint);

        var sudokuEndpoint = app.MapGet("/api/sudoku", SudokuApp.GetPuzzleEndpoint);
        DecorateSudokuEndpoint(sudokuEndpoint);

        return app;
    }

    public static SudokuPuzzle BuildPuzzleResponse(SudokuGenerator generator, string difficulty)
    {
        if (!SudokuDifficulty.TryNormalize(difficulty, out var normalizedDifficulty))
        {
            throw new ArgumentException($"Unsupported difficulty: {difficulty}", nameof(difficulty));
        }

        int cellsToRemove = SudokuDifficulty.GetCellsToRemove(normalizedDifficulty);
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
            Difficulty = normalizedDifficulty
        };
    }

    public static IResult GetPuzzleEndpoint(SudokuGenerator generator, [FromQuery] string difficulty = "easy")
    {
        var validationError = ValidateDifficulty(difficulty);
        if (validationError != null)
        {
            return Results.BadRequest(new { error = validationError });
        }
        
        return Results.Ok(BuildPuzzleResponse(generator, difficulty));
    }

    public static IResult GetHealthEndpoint()
    {
        return Results.Ok(new { status = "ok" });
    }

    [ExcludeFromCodeCoverage]
    private static void DecorateSudokuEndpoint(RouteHandlerBuilder endpoint)
    {
        endpoint.WithName("GetSudokuPuzzle");
        endpoint.WithOpenApi();
    }

    [ExcludeFromCodeCoverage]
    private static void DecorateHealthEndpoint(RouteHandlerBuilder endpoint)
    {
        endpoint.WithName("GetHealth");
        endpoint.WithOpenApi();
    }
}
