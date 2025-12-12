import { Injectable } from '@angular/core';
import { Difficulty } from './sudoku.interface';

export type DifficultyStats = {
  gamesCompleted: number;
  fastestTime: number | null;
};

export type SudokuStats = Record<Difficulty, DifficultyStats>;

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private readonly storageKey = 'sudokuStats';

  private readonly defaultStats: SudokuStats = {
    [Difficulty.Easy]: { gamesCompleted: 0, fastestTime: null },
    [Difficulty.Medium]: { gamesCompleted: 0, fastestTime: null },
    [Difficulty.Hard]: { gamesCompleted: 0, fastestTime: null }
  };

  getStats(): SudokuStats {
    const savedStats = localStorage.getItem(this.storageKey);

    if (!savedStats) {
      return { ...this.defaultStats };
    }

    try {
      const parsed = JSON.parse(savedStats) as Partial<SudokuStats>;
      return this.mergeWithDefaults(parsed);
    } catch {
      return { ...this.defaultStats };
    }
  }

  recordCompletion(difficulty: Difficulty, elapsedSeconds: number): SudokuStats {
    const stats = this.getStats();
    const current = stats[difficulty];

    stats[difficulty] = {
      gamesCompleted: current.gamesCompleted + 1,
      fastestTime: this.pickFastestTime(current.fastestTime, elapsedSeconds)
    };

    this.save(stats);
    return stats;
  }

  private save(stats: SudokuStats): void {
    localStorage.setItem(this.storageKey, JSON.stringify(stats));
  }

  private pickFastestTime(existing: number | null, candidate: number): number {
    if (existing === null || candidate < existing) {
      return candidate;
    }

    return existing;
  }

  private mergeWithDefaults(parsed: Partial<SudokuStats>): SudokuStats {
    const merged: SudokuStats = { ...this.defaultStats };

    (Object.keys(this.defaultStats) as Difficulty[]).forEach(key => {
      const savedStats = parsed[key];

      merged[key] = {
        gamesCompleted: savedStats?.gamesCompleted ?? 0,
        fastestTime: typeof savedStats?.fastestTime === 'number' ? savedStats.fastestTime : null
      };
    });

    return merged;
  }
}
