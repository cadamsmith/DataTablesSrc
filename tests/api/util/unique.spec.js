import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test.describe('unique()', () => {
  test('Check the defaults', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await test.step('Exists and is a function', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
      const type = await page.evaluate(() => typeof window.table.unique);
      expect(type).toBe('function');
    });
    await test.step('Returns API instance', async () => {
      const isApi = await page.evaluate(() => window.table.unique() instanceof $.fn.dataTable.Api);
      expect(isApi).toBe(true);
    });
  });

  test('Functional tests', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await page.evaluate(() => {
      window.table = $('#example').DataTable();
    });
    await test.step('Check uniqueness on Strings', async () => {
      const result = await page.evaluate(() => {
        const data = window.table.column(2).data().unique();
        return {
          count: data.count(),
          values: Array.from({length: data.count()}, (_, i) => data[i])
        };
      });
      expect(result.count).toBe(7);
      expect(result.values).toEqual([
        'Tokyo',
        'London',
        'San Francisco',
        'New York',
        'Edinburgh',
        'Sidney',
        'Singapore'
      ]);
    });
    await test.step('Get unique data from numerical column', async () => {
      const result = await page.evaluate(() => {
        const data = window.table.column(3).data().unique();
        return data.count();
      });
      expect(result).toBe(33);
    });
    await test.step('Get unique data from date column', async () => {
      const result = await page.evaluate(() => {
        const data = window.table.column(4).data().unique();
        return data.count();
      });
      expect(result).toBe(57);
    });
  });
});
