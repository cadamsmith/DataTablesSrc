import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test.describe('length', () => {
  test('Check the defaults', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await test.step('Returns number', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
      const type = await page.evaluate(() => typeof window.table.rows().length);
      expect(type).toBe('number');
    });
  });

  test('Functional tests', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await test.step('1D array', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
      const len = await page.evaluate(() => window.table.rows().length);
      expect(len).toBe(1);
    });
    await test.step('2D array true', async () => {
      const len = await page.evaluate(() => window.table.columns().data().length);
      expect(len).toBe(6);
    });
    await test.step('2D array flattened', async () => {
      const count = await page.evaluate(() => window.table.columns().data().flatten().count());
      expect(count).toBe(342);
    });
  });
});
