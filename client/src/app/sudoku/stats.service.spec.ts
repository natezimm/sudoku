import { StatsService } from './stats.service';
import { Difficulty } from './sudoku.interface';

describe('StatsService', () => {
  let service: StatsService;

  beforeEach(() => {
    localStorage.clear();
    service = new StatsService();
  });

  it('returns default stats when nothing is saved or JSON is invalid', () => {
    expect(service.getStats()).toEqual({
      [Difficulty.Easy]: { gamesCompleted: 0, fastestTime: null },
      [Difficulty.Medium]: { gamesCompleted: 0, fastestTime: null },
      [Difficulty.Hard]: { gamesCompleted: 0, fastestTime: null }
    });

    localStorage.setItem('sudokuStats', 'not-json');
    expect(service.getStats()).toEqual({
      [Difficulty.Easy]: { gamesCompleted: 0, fastestTime: null },
      [Difficulty.Medium]: { gamesCompleted: 0, fastestTime: null },
      [Difficulty.Hard]: { gamesCompleted: 0, fastestTime: null }
    });
  });

  it('merges saved stats with defaults and ignores invalid fastest times', () => {
    const stored = {
      [Difficulty.Easy]: { gamesCompleted: 2, fastestTime: 75 },
      [Difficulty.Medium]: { gamesCompleted: 1, fastestTime: 'bad' },
    };
    localStorage.setItem('sudokuStats', JSON.stringify(stored));

    const stats = service.getStats();
    expect(stats[Difficulty.Easy]).toEqual({ gamesCompleted: 2, fastestTime: 75 });
    expect(stats[Difficulty.Medium]).toEqual({ gamesCompleted: 1, fastestTime: null });
    expect(stats[Difficulty.Hard]).toEqual({ gamesCompleted: 0, fastestTime: null });
  });

  it('records a completion and saves the updated stats', () => {
    localStorage.setItem(
      'sudokuStats',
      JSON.stringify({
        [Difficulty.Easy]: { gamesCompleted: 1, fastestTime: 120 },
        [Difficulty.Medium]: { gamesCompleted: 0, fastestTime: null },
        [Difficulty.Hard]: { gamesCompleted: 0, fastestTime: 200 }
      })
    );

    spyOn(localStorage, 'setItem').and.callThrough();

    const updated = service.recordCompletion(Difficulty.Easy, 90);
    expect(updated[Difficulty.Easy]).toEqual({ gamesCompleted: 2, fastestTime: 90 });
    expect(localStorage.setItem).toHaveBeenCalled();

    const slower = service.recordCompletion(Difficulty.Hard, 250);
    expect(slower[Difficulty.Hard]).toEqual({ gamesCompleted: 1, fastestTime: 200 });
  });
});
