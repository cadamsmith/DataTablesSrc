import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test.describe('pluck()', () => {
  test('Check the defaults', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await test.step('Exists and is a function', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
      const type = await page.evaluate(() => typeof window.table.pluck);
      expect(type).toBe('function');
    });
    await test.step('Returns API instance', async () => {
      const isApi = await page.evaluate(() => window.table.pluck() instanceof $.fn.dataTable.Api);
      expect(isApi).toBe(true);
    });
  });

  test('Functional tests', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await test.step('Can use numerical parameter to get array item', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
      const result = await page.evaluate(() => {
        const data = window.table.rows().data().pluck(3);
        return {
          count: data.count(),
          first: data[0],
          last: data[56]
        };
      });
      expect(result.count).toBe(57);
      expect(result.first).toBe('33');
      expect(result.last).toBe('56');
    });
    await test.step('Can use numerical parameter to break into an array', async () => {
      const result = await page.evaluate(() => {
        const data = window.table.column(2).data().pluck(0);
        return {
          count: data.count(),
          first: data[0],
          last: data[56]
        };
      });
      expect(result.count).toBe(57);
      expect(result.first).toBe('T');
      expect(result.last).toBe('S');
    });
    // Additional tests for string/nested pluck could be added here, but require async/complex setup
  });
});
