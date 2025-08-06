import { test, expect } from '@playwright/test';
import { loadTestPage } from '../helpers';

test('nonJQuery - init', async ({ page }) => {
  await loadTestPage(page, 'basic');

  await test.step('No options', async () => {
    await page.evaluate(() => {
      window.table = new DataTable('#example');
    });

    let actual = await page.evaluate(() => window.table.rows().count());
    expect(actual).toBe(57);

    actual = await page.evaluate(() => ($('tbody tr').length));
    expect(actual).toBe(10);
  });

  await loadTestPage(page, 'basic');

  await test.step('Options', async () => {
    await page.evaluate(() => {
      window.table = new DataTable('#example', {
        paging: false
      });
    });

    let actual = await page.evaluate(() => window.table.rows().count());
    expect(actual).toBe(57);

    actual = await page.evaluate(() => ($('tbody tr').length));
    expect(actual).toBe(57);
  });
});
