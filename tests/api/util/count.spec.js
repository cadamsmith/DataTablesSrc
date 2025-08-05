import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test.describe('count()', () => {
  test('Check the defaults', async ({ page }) => {
    await loadTestPage(page, 'basic');

    await test.step('Exists and is a function', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });

      const type = await page.evaluate(() => typeof window.table.count);
      expect(type).toBe('function');
    });

    await test.step('Returns number', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });

      const type = await page.evaluate(() => typeof window.table.rows().count());
      expect(type).toBe('number');
    });
  });

  test('Functional tests', async ({ page }) => {
    await loadTestPage(page, 'basic');

    await test.step('1D array', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });

      const actual = await page.evaluate(() => window.table.rows().count());
      expect(actual).toBe(57);
    });

    await test.step('2D array true', async () => {
      const actual = await page.evaluate(() => {
        return window.table.columns().data().count()
      });
      expect(actual).toBe(342);
    });

    await test.step('2D array flattened', async () => {
      const actual = await page.evaluate(() => {
        return window.table.columns().data().flatten().count()
      });
      expect(actual).toBe(342);
    });
  });
});
