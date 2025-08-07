import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test.describe('slice()', () => {
  test('Check the defaults', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await test.step('Exists and is a function', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
      const type = await page.evaluate(() => typeof window.table.slice);
      expect(type).toBe('function');
    });
    await test.step('Returns API instance', async () => {
      const isApi = await page.evaluate(() => window.table.slice() instanceof $.fn.dataTable.Api);
      expect(isApi).toBe(true);
    });
  });

  test('Functional tests', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await test.step('Create basic DataTable', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
      const result = await page.evaluate(() => {
        const data = window.table.column(2).data().unique().sort();
        return { count: data.count() };
      });
      expect(result.count).toBe(7);
    });
    await test.step('Create copy of instance', async () => {
      const result = await page.evaluate(() => {
        const data = window.table.column(2).data().unique().sort();
        const dataSliced = data.slice();
        return { count: dataSliced.count() };
      });
      expect(result.count).toBe(7);
    });
    await test.step('Push to sliced copy', async () => {
      const result = await page.evaluate(() => {
        const data = window.table.column(2).data().unique().sort();
        const dataSliced = data.slice();
        dataSliced.push('newCity');
        return { count: dataSliced.count(), last: dataSliced[dataSliced.count() - 1] };
      });
      expect(result.count).toBe(8);
      expect(result.last).toBe('newCity');
    });
  });
});
