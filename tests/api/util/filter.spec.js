import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test.describe('filter()', () => {
  test('Check the defaults', async ({ page }) => {
    await loadTestPage(page, 'basic');

    await test.step('Exists and is a function', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });

      const type = await page.evaluate(() => typeof window.table.filter);
      expect(type).toBe('function');
    });

    await test.step('Returns API instance', async () => {
      const actual = await page.evaluate(() => {
        return window.table
          .column(0)
          .data()
          .filter(function() {
            window.params = arguments;
            return true;
          }) instanceof $.fn.dataTable.Api
      });
      expect(actual).toBe(true);
    });

    await test.step('Correct params to function', async () => {
      let actual = await page.evaluate(() => window.params.length);
      expect(actual).toBe(3);

      actual = await page.evaluate(() => typeof params[0]);
      expect(actual).toBe('string');

      actual = await page.evaluate(() => typeof params[1]);
      expect(actual).toBe('number');

      actual = await page.evaluate(() => window.params[2] instanceof $.fn.dataTable.Api);
      expect(actual).toBe(true);
    });
  });

  test('Functional tests', async ({ page }) => {
    await loadTestPage(page, 'basic');

    await test.step('Filtering 1d data', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
      const result = await page.evaluate(() => {
        let count = 0;
        let params;
        const data = window.table
          .column(2)
          .data()
          .filter(function(value) {
            count++;
            params = arguments;
            return value === 'London' ? true : false;
          });
        return {
          count: data.count(),
          firstParam: params[0],
          secondParam: params[1],
          calls: count
        };
      });
      expect(result.count).toBe(12);
      expect(result.firstParam).toBe('San Francisco');
      expect(result.secondParam).toBe(56);
      expect(result.calls).toBe(57);
    });

    await test.step('Filtering 2d data', async () => {
      const result = await page.evaluate(() => {
        let count = 0;
        const data = window.table
          .columns([0, 2])
          .data()
          .filter(function(value) {
            count++;
            return true;
          });
        return {
          count: data.count(),
          calls: count
        };
      });
      expect(result.count).toBe(114);
      expect(result.calls).toBe(2);
    });
  });
});
