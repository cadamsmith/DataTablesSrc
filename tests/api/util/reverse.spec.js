import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test.describe('reverse()', () => {
  test('Check the defaults', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await test.step('Exists and is a function', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
      const type = await page.evaluate(() => typeof window.table.reverse);
      expect(type).toBe('function');
    });
    await test.step('Returns API instance', async () => {
      const isApi = await page.evaluate(() => window.table.reverse() instanceof $.fn.dataTable.Api);
      expect(isApi).toBe(true);
    });
  });

  test('Functional tests', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await test.step('Confirm with ordered list', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
      const result = await page.evaluate(() => {
        const forward = window.table.column(2).data().unique().sort();
        const backward = forward.slice().reverse();
        const count = forward.count();
        let isReversed = count === backward.count();
        for (let i = 0; i < count; i++) {
          if (forward[i] !== backward[count - i - 1]) isReversed = false;
        }
        return isReversed;
      });
      expect(result).toBe(true);
    });
  });
});
