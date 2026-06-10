public static class SudokuDifficulty
{
    private static readonly IReadOnlyDictionary<string, int> CellsToRemoveByDifficulty =
        new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
        {
            ["easy"] = 45,
            ["medium"] = 51,
            ["hard"] = 55
        };

    public static IReadOnlyCollection<string> AllowedValues => CellsToRemoveByDifficulty.Keys.ToArray();

    public static bool TryNormalize(string? difficulty, out string normalizedDifficulty)
    {
        normalizedDifficulty = string.Empty;

        if (string.IsNullOrWhiteSpace(difficulty))
        {
            return false;
        }

        if (!CellsToRemoveByDifficulty.ContainsKey(difficulty))
        {
            return false;
        }

        normalizedDifficulty = difficulty.ToLowerInvariant();
        return true;
    }

    public static int GetCellsToRemove(string difficulty)
    {
        if (!CellsToRemoveByDifficulty.TryGetValue(difficulty, out int cellsToRemove))
        {
            throw new ArgumentException($"Unsupported difficulty: {difficulty}", nameof(difficulty));
        }

        return cellsToRemove;
    }
}
