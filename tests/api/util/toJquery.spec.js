import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test.describe('toJQuery()', () => {
  test('Check the defaults', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await test.step('Exists and is a function', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
      const type = await page.evaluate(() => typeof window.table.toJQuery);
      expect(type).toBe('function');
    });
    await test.step('Returns jQuery instance', async () => {
      const isJq = await page.evaluate(() => !!window.table.toJQuery().jquery);
      expect(isJq).toBe(true);
    });
  });

  test('Functional tests', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await test.step('No selector', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
      const length = await page.evaluate(() => window.table.cells('.notThere').data().toJQuery().length);
      expect(length).toBe(0);
    });
    await test.step('Single selector', async () => {
      const result = await page.evaluate(() => {
        const jq = window.table.column(0).data().toJQuery();
        return { length: jq.length, first: jq[0] };
      });
      expect(result.length).toBe(57);
      expect(result.first).not.toBe(undefined);
    });
    await test.step('Multiple selectors', async () => {
      const result = await page.evaluate(() => {
        const jq = window.table.rows([2, 3]).data().toJQuery();
        return { length: jq.length };
      });
      expect(result.length).toBe(2);
    });
  });
});
