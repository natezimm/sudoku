import { expect, test } from '@playwright/test';

const puzzle = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

const solution = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

const mockPuzzleApi = async (page, board = puzzle) => {
  await page.route('**/api/sudoku?**', async (route) => {
    const url = new URL(route.request().url());
    const difficulty = url.searchParams.get('difficulty') ?? 'easy';

    await route.fulfill({
      json: {
        puzzle: board,
        difficulty,
      },
    });
  });
};

test.describe('sudoku client', () => {
  test.beforeEach(async ({ page }) => {
    await mockPuzzleApi(page);
  });

  test('loads the board and primary controls', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Sudoku/);
    await expect(page.locator('.header')).toContainText('FUNSUDOKU');
    await expect(
      page.getByRole('button', { name: 'Check Solution' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Clear Input' })
    ).toBeVisible();
    await expect(page.locator('.grid-cell')).toHaveCount(81);
    await expect(page.getByLabel('Row 1, Column 3')).toBeVisible();
  });

  test('accepts grid input and can clear it', async ({ page }) => {
    await page.goto('/');

    const cell = page.getByLabel('Row 1, Column 3');

    await cell.fill('4');
    await expect(cell).toHaveValue('4');

    await page.getByRole('button', { name: 'Clear Input' }).click();
    await expect(cell).toHaveValue('');
  });

  test('opens stats and changes difficulty with confirmation', async ({
    page,
  }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'View stats' }).click();
    await expect(page.getByRole('dialog', { name: 'Stats' })).toBeVisible();
    await page.getByRole('button', { name: 'Close stats' }).click();
    await expect(page.getByRole('dialog', { name: 'Stats' })).not.toBeVisible();

    await page.getByRole('button', { name: 'Medium' }).click();
    await expect(
      page.getByRole('dialog', { name: 'Confirm difficulty change' })
    ).toBeVisible();
    await page.getByRole('button', { name: 'Yes, start new' }).click();
    await expect(page.getByRole('button', { name: 'Medium' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });

  test('pauses and resumes the timer', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Pause timer' }).click();
    await expect(
      page.getByRole('button', { name: 'Resume timer' })
    ).toBeVisible();

    await page.getByRole('button', { name: 'Resume timer' }).click();
    await expect(
      page.getByRole('button', { name: 'Pause timer' })
    ).toBeVisible();
  });

  test('traps dialog focus and restores the triggering control on dismissal', async ({
    page,
  }) => {
    await page.goto('/');

    const statsButton = page.getByRole('button', { name: 'View stats' });
    await statsButton.click();
    const statsDialog = page.getByRole('dialog', { name: 'Stats' });
    const closeStats = statsDialog.getByRole('button', { name: 'Close stats' });
    await expect(statsDialog).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(closeStats).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(closeStats).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(closeStats).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(statsDialog).not.toBeVisible();
    await expect(statsButton).toBeFocused();

    const newPuzzle = page.getByRole('button', {
      name: 'New puzzle',
      exact: true,
    });
    await newPuzzle.click();
    const confirmDialog = page.getByRole('dialog', {
      name: 'Confirm difficulty change',
    });
    const cancel = confirmDialog.getByRole('button', {
      name: 'No, keep playing',
    });
    const confirm = confirmDialog.getByRole('button', {
      name: 'Yes, start new',
    });
    await expect(confirmDialog).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(confirm).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(cancel).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(confirm).toBeFocused();
    await cancel.click();
    await expect(confirmDialog).not.toBeVisible();
    await expect(newPuzzle).toBeFocused();
    await expect(page.locator('.page-content')).not.toHaveAttribute('inert');
  });

  test('recovers from a failed puzzle request and clears its error status', async ({
    page,
  }) => {
    let requests = 0;
    await page.route('**/api/sudoku?**', async (route) => {
      requests += 1;
      if (requests === 1) {
        await route.fulfill({ status: 503, json: { error: 'Unavailable' } });
        return;
      }
      await route.fulfill({ json: { puzzle, difficulty: 'easy' } });
    });
    await page.goto('/');

    const status = page.locator('.user-message');
    await expect(status).toContainText('Unable to load a puzzle');
    await expect(
      page.getByRole('button', { name: 'Check Solution' })
    ).toBeDisabled();
    await page.getByRole('button', { name: 'Try again', exact: true }).click();
    await expect(page.locator('.grid-cell')).toHaveCount(81);
    await expect(status).toContainText('Welcome!');
    await expect(status).not.toContainText('Unable to load');
    await expect(
      page.getByRole('button', { name: 'Try again', exact: true })
    ).not.toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Check Solution' })
    ).toBeEnabled();
    await expect(
      page.getByRole('button', { name: 'Pause timer' })
    ).toBeEnabled();
    expect(requests).toBe(2);
  });

  test('enters and erases keypad values and resumes saved progress', async ({
    page,
  }) => {
    await page.goto('/');

    const cell = page.getByLabel('Row 1, Column 3', { exact: true });
    await cell.click();
    await page.getByRole('button', { name: 'Enter 4', exact: true }).click();
    await expect(cell).toHaveValue('4');
    await expect(cell).toBeFocused();

    await page.getByRole('button', { name: 'Erase selected cell' }).click();
    await expect(cell).toHaveValue('');
    await expect(cell).toBeFocused();

    await page.getByRole('button', { name: 'Enter 4', exact: true }).click();
    await page.reload();
    const resumeDialog = page.getByRole('dialog', {
      name: 'Resume saved game',
    });
    await expect(resumeDialog).toBeVisible();
    await resumeDialog
      .getByRole('button', { name: 'Resume', exact: true })
      .click();
    await expect(resumeDialog).not.toBeVisible();
    await expect(cell).toHaveValue('4');
  });

  test('arrow keys follow adjacent board coordinates including givens', async ({
    page,
  }) => {
    await page.goto('/');

    const start = page.getByLabel('Row 1, Column 3', { exact: true });
    await start.click();
    await page.keyboard.press('ArrowRight');
    await expect(
      page.getByLabel('Row 1, Column 4', { exact: true })
    ).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(
      page.getByRole('button', { name: 'Row 2, Column 4, given 1' })
    ).toBeFocused();
    await expect(
      page.getByRole('button', { name: 'Enter 4', exact: true })
    ).toBeDisabled();

    await page.keyboard.press('ArrowLeft');
    await expect(
      page.getByLabel('Row 2, Column 3', { exact: true })
    ).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await expect(start).toBeFocused();
  });

  test('lays out actual rows and columns within the viewport', async ({
    page,
  }) => {
    await page.goto('/');

    const upperRight = page.getByLabel('Row 1, Column 3', { exact: true });
    const lowerLeft = page.getByLabel('Row 2, Column 2', { exact: true });
    await expect(upperRight).toBeVisible();
    await expect(lowerLeft).toBeVisible();
    const first = await upperRight.boundingBox();
    const second = await lowerLeft.boundingBox();

    expect(first.x).toBeGreaterThan(second.x);
    expect(first.y).toBeLessThan(second.y);

    const viewport = page.viewportSize();
    const board = await page.locator('.sudoku-grid').boundingBox();
    expect(board.x).toBeGreaterThanOrEqual(0);
    expect(board.x + board.width).toBeLessThanOrEqual(viewport.width + 1);
    const pageWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    expect(pageWidth).toBeLessThanOrEqual(viewport.width + 1);
  });

  test('persists the selected theme across reloads', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    await expect(page.locator('html')).toHaveClass(/dark-mode/);
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark-mode/);
    const resumeDialog = page.getByRole('dialog', {
      name: 'Resume saved game',
    });
    await resumeDialog
      .getByRole('button', { name: 'Resume', exact: true })
      .click();
    await page.getByRole('button', { name: 'Switch to light mode' }).click();
    await expect(page.locator('html')).not.toHaveClass(/dark-mode/);
    await page.reload();
    await expect(page.locator('html')).not.toHaveClass(/dark-mode/);
  });

  test('keeps progress when a new puzzle is cancelled and resets on confirmation', async ({
    page,
  }) => {
    await page.goto('/');

    const cell = page.getByLabel('Row 1, Column 3', { exact: true });
    await cell.fill('4');
    await page.getByRole('button', { name: 'New puzzle', exact: true }).click();
    const confirmDialog = page.getByRole('dialog', {
      name: 'Confirm difficulty change',
    });
    await expect(confirmDialog).toBeVisible();
    await confirmDialog
      .getByRole('button', { name: 'No, keep playing' })
      .click();
    await expect(confirmDialog).not.toBeVisible();
    await expect(cell).toHaveValue('4');
    await expect(
      page.getByRole('button', { name: 'Pause timer' })
    ).toBeVisible();

    await page.getByRole('button', { name: 'New puzzle', exact: true }).click();
    await confirmDialog.getByRole('button', { name: 'Yes, start new' }).click();
    await expect(confirmDialog).not.toBeVisible();
    await expect(cell).toHaveValue('');
    await expect(
      page.getByRole('button', { name: 'Easy', exact: true })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('records a completed puzzle once and clears its saved progress', async ({
    page,
  }) => {
    const almostSolved = solution.map((row) => [...row]);
    almostSolved[0][2] = 0;
    await mockPuzzleApi(page, almostSolved);
    await page.goto('/');

    await page.getByLabel('Row 1, Column 3', { exact: true }).fill('4');
    const checkButton = page.getByRole('button', { name: 'Check Solution' });
    await checkButton.dblclick();
    const completedCount = () =>
      page.evaluate(() => {
        const stats = JSON.parse(localStorage.getItem('sudokuStats'));
        return stats?.easy.gamesCompleted ?? 0;
      });
    await expect.poll(completedCount).toBe(1);

    await expect(checkButton).toBeDisabled();
    await expect.poll(completedCount).toBe(1);
    await expect(
      page.getByLabel('Row 1, Column 3', { exact: true })
    ).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Enter 4', exact: true })
    ).toBeDisabled();
    await expect(
      page.getByRole('button', { name: 'Pause timer' })
    ).toBeDisabled();
    expect(
      await page.evaluate(() => localStorage.getItem('sudokuActiveGame'))
    ).toBeNull();
  });
});
