import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test.describe('eq()', () => {
  test('Check the defaults', async ({ page }) => {
    await loadTestPage(page, 'basic');

    await test.step('Exists and is a function', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });

      const type = await page.evaluate(() => typeof window.table.eq);
      expect(type).toBe('function');
    });

    await test.step('Returns API instance', async () => {
      const actual = await page.evaluate(() => window.table.rows().eq(0) instanceof $.fn.dataTable.Api);
      expect(actual).toBe(true);
    });
  });

  test('Functional tests', async ({ page }) => {
    await loadTestPage(page, 'two_tables');

    await test.step('Check first table', async () => {
      await page.evaluate(() => {
        window.tables = $('table').DataTable();
      });

      let [data1, data2] = await page.evaluate(() => {
        const data1 = window.tables.eq(0).row(2).data();
        const data2 = window.tables.rows().eq(0) .data()[2];

        return [data1, data2];
      });

      expect(data1).toEqual(['Ashton Cox', 'Junior Technical Author', 'San Francisco', '66', '2009/01/12', '$86,000']);
      expect(data2).toEqual(['Ashton Cox', 'Junior Technical Author', 'San Francisco', '66', '2009/01/12', '$86,000']);
    });

    await test.step('Check second table', async () => {
      await page.evaluate(() => {
        window.tables = $('table').DataTable();
      });

      let [data1, data2] = await page.evaluate(() => {
        const data1 = window.tables.eq(1).row(2).data();
        const data2 = window.tables.rows().eq(1).data()[2];

        return [data1, data2];
      });

      expect(data1).toEqual(['Milan', '534', '436892']);
      expect(data2).toEqual(['Milan', '534', '436892']);
    });
  });
});
