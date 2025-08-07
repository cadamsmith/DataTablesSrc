import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test.describe('toArray()', () => {
  test('Check the defaults', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await test.step('Exists and is a function', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
      const type = await page.evaluate(() => typeof window.table.toArray);
      expect(type).toBe('function');
    });
    await test.step('Returns Array instance', async () => {
      const isArray = await page.evaluate(() => Array.isArray(window.table.toArray()));
      expect(isArray).toBe(true);
    });
  });

  test('Functional tests', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await test.step('No array', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
      const length = await page.evaluate(() => window.table.cells('.notThere').data().toArray().length);
      expect(length).toBe(0);
    });
    await test.step('Single array', async () => {
      const result = await page.evaluate(() => {
        const arr = window.table.column(0).data().toArray();
        return { length: arr.length, first: arr[0] };
      });
      expect(result.length).toBe(57);
      expect(result.first).toBe('Airi Satou');
    });
    await test.step('Multiple arrays', async () => {
      const result = await page.evaluate(() => {
        const arr = window.table.rows([2, 3]).data().toArray();
        return { length: arr.length };
      });
      expect(result.length).toBe(2);
    });
  });
});
