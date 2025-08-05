import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test('Awkward id', async ({ page }) => {
  await loadTestPage(page, 'basic');

  await test.step('DataTables can be initialised on an element with id characters that would normally be escaped', async () => {
    await page.evaluate(() => {
      window.table = document.getElementById('example');
      window.table.id = 'concert:307.+media';
      new DataTable(window.table);
    });

    const actual = await page.evaluate(() => $('tbody td').eq(0).text());
    expect(actual).toBe('Airi Satou');
  });
});
