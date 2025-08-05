import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test('Empty DataTable', async ({ page }) => {
  await loadTestPage(page, 'no-columns');

  await test.step('DataTables can be initialised without anything in the columns', async () => {
    await page.evaluate(() => {
      $('#test').DataTable();
    });

    // No JS errors occurred
    expect(true).toBe(true);
  });
});
