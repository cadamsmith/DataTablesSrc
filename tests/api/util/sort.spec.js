import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test.describe('sort()', () => {
  test('Check the defaults', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await test.step('Exists and is a function', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
      const type = await page.evaluate(() => typeof window.table.sort);
      expect(type).toBe('function');
    });
    await test.step('Returns whatever function returns', async () => {
      const isApi = await page.evaluate(() => {
        let params;
        let count = 0;
        const result = window.table.column(3).data().sort(function() {
          params = arguments;
          count++;
          window._sortParams = params;
          window._sortCount = count;
          return 0;
        });
        return result instanceof $.fn.dataTable.Api;
      });
      expect(isApi).toBe(true);
    });
    await test.step('Correct params to function', async () => {
      const [count, paramsLen, t0, t1] = await page.evaluate(() => {
        const params = window._sortParams;
        const count = window._sortCount;
        return [count, params.length, typeof params[0], typeof params[1]];
      });
      expect(count).toBe(56);
      expect(paramsLen).toBe(2);
      expect(t0).toBe('string');
      expect(t1).toBe('string');
    });
  });

  test('Functional tests', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await test.step('Can sort without a function', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
      const sorted = await page.evaluate(() => {
        const data = window.table.column(3).data().sort();
        return data[0];
      });
      expect(typeof sorted).toBe('string');
    });
  });
});
