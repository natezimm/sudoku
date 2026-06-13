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

const mockPuzzleApi = async (page) => {
  await page.route('**/api/sudoku?**', async (route) => {
    const url = new URL(route.request().url());
    const difficulty = url.searchParams.get('difficulty') ?? 'easy';

    await route.fulfill({
      json: {
        puzzle,
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
});
