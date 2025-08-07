import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test.describe('iterator()', () => {
  test('Check the defaults', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await test.step('Exists and is a function', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
      const type = await page.evaluate(() => typeof window.table.iterator);
      expect(type).toBe('function');
    });
    await test.step('Returns API instance', async () => {
      const isApi = await page.evaluate(() => {
        const result = window.table.rows().iterator('row', function() {
          window.params = arguments;
        });
        return result instanceof $.fn.dataTable.Api;
      });
      expect(isApi).toBe(true);
    });
    await test.step('Correct params to function', async () => {
      const params = await page.evaluate(() => {
        const p = window.params;
        return [
          p.length,
          p[0] === window.table.settings()[0],
          typeof p[1],
          typeof p[2],
          typeof p[3],
          typeof p[4]
        ];
      });
      expect(params[0]).toBe(5);
      expect(params[1]).toBe(true);
      expect(params[2]).toBe('number');
      expect(params[3]).toBe('number');
      expect(params[4]).toBe('number');
      expect(params[5]).toBe('undefined');
    });
  });

  test('Functional tests', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await test.step('Iterate over 1d data', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
      const result = await page.evaluate(() => {
        let count = 0;
        let values = [];
        const res = window.table.rows().iterator(
          'row',
          function(settings, row) {
            count++;
            values.push(row);
          },
          'test'
        );
        return {
          values: values,
          expected: window.table.rows()[0],
          count: count
        };
      });
      expect(result.values).toEqual(result.expected);
      expect(result.count).toBe(57);
    });
  });
});
