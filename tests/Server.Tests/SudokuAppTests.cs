using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.Extensions.Configuration;
using System;
using System.Linq;
using Xunit;

public class SudokuAppTests
{
    private const string ClientUrlKey = "ClientUrl";
    private const string ClientUrlValue = "https://example.com";

    private static void EnsureClientUrl()
    {
        Environment.SetEnvironmentVariable(ClientUrlKey, ClientUrlValue);
    }

    [Fact]
    public void GetClientUrl_ReturnsConfiguredValue()
    {
        var configuration = new ConfigurationManager();
        configuration["ClientUrl"] = "https://example.com";

        string result = SudokuApp.GetClientUrl(configuration);

        Assert.Equal("https://example.com", result);
    }

    [Fact]
    public void GetClientUrl_ThrowsWhenMissing()
    {
        var configuration = new ConfigurationManager();
        var exception = Assert.Throws<InvalidOperationException>(() => SudokuApp.GetClientUrl(configuration));
        Assert.Equal("ClientUrl is not configured.", exception.Message);
    }

    [Fact]
    public void Create_BuildsPipelineWithoutRunning()
    {
        var builder = WebApplication.CreateBuilder();
        builder.Configuration["ClientUrl"] = "https://example.com";
        builder.Environment.EnvironmentName = "Development";
        var clientUrl = SudokuApp.GetClientUrl(builder.Configuration);

        using var app = SudokuApp.Create(builder, clientUrl);

        Assert.NotNull(app);
        Assert.NotNull(app.Environment);
        Assert.NotNull(app.Services.GetService(typeof(IConfiguration)));
    }

    [Fact]
    public void ConfigureCors_AddsAllowClientPolicy()
    {
        var options = new CorsOptions();

        SudokuApp.ConfigureCors(options, "https://example.com");
        var policy = options.GetPolicy("AllowClient");

        Assert.NotNull(policy);
        Assert.Contains("https://example.com", policy.Origins);
    }

    [Theory]
    [InlineData("easy", 45)]
    [InlineData("medium", 51)]
    [InlineData("hard", 55)]
    [InlineData("unknown", 45)]
    public void BuildPuzzleResponse_ProducesExpectedCount(string difficulty, int expectedZeros)
    {
        var response = SudokuApp.BuildPuzzleResponse(difficulty);

        Assert.Equal(difficulty, response.Difficulty);
        Assert.Equal(9, response.Puzzle.Length);
        int zeros = response.Puzzle.SelectMany(row => row).Count(value => value == 0);
        Assert.Equal(expectedZeros, zeros);
    }

    [Fact]
    public void ProgramRun_ReturnsApplication()
    {
        EnsureClientUrl();

        using var app = Program.Run(Array.Empty<string>());

        Assert.NotNull(app);
        Assert.NotNull(app.Services.GetService(typeof(IConfiguration)));
    }

    [Fact]
    public void Main_SkipsRunWhenFlagSet()
    {
        EnsureClientUrl();
        AppContext.SetSwitch("SkipAppRun", true);
        try
        {
            Program.Main(Array.Empty<string>());
        }
        finally
        {
            AppContext.SetSwitch("SkipAppRun", false);
        }
    }

    [Fact]
    public void BuildPuzzleResponse_ReturnsExpectedStructure()
    {
        var response = SudokuApp.BuildPuzzleResponse("hard");

        Assert.Equal("hard", response.Difficulty);
        Assert.Equal(9, response.Puzzle.Length);
        Assert.All(response.Puzzle, row => Assert.Equal(9, row.Length));

        int zeros = response.Puzzle.SelectMany(row => row).Count(value => value == 0);
        Assert.Equal(55, zeros);
    }
}
