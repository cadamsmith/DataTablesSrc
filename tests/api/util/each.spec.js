import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test.describe('each()', () => {
  test('Check the defaults', async ({ page }) => {
    await loadTestPage(page, 'basic');

    await test.step('Exists and is a function', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });

      const type = await page.evaluate(() => typeof window.table.each);
      expect(type).toBe('function');
    });

    await test.step('Returns API instance', async () => {
      const actual = await page.evaluate(() => window.table.each() instanceof $.fn.dataTable.Api);
      expect(actual).toBe(true);
    });
  });

  test('Functional tests', async ({ page }) => {
    await loadTestPage(page, 'basic');

    await test.step('First argument is the value in the result set', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });

      let results = await page.evaluate(() => {
        const res = [];

        window.table
          .rows([2, 3, 4], {order: 'index'})
          .indexes()
          .each(function(v, i, a) {
            res.push(v);
          });

        return res;
      });

      let counter = 0;
      for (const result of results) {
        expect(result).toBe(2 + counter++);
      }
      expect(counter).toBe(3);
    });

    await test.step('Second argument is the value in the result set', async () => {
      let results = await page.evaluate(() => {
        const res = [];

        window.table
          .rows([2, 3, 4], {order: 'index'})
          .indexes()
          .each(function(v, i, a) {
            res.push(i);
          });

        return res;
      });

      let counter = 0;
      for (const result of results) {
        expect(result).toBe(counter++);
      }
      expect(counter).toBe(3);
    });

    await test.step('Third argument is the API instance', async () => {
      let results = await page.evaluate(() => {
        const res = [];

        window.table
          .rows([2, 3, 4], {order: 'index'})
          .indexes()
          .each(function(v, i, a) {
            res.push(a instanceof $.fn.dataTable.Api);
          });

        return res;
      });

      let counter = 0;
      for (const result of results) {
        expect(result).toBe(true);
        counter++;
      }
      expect(counter).toBe(3);
    });
  });
});
