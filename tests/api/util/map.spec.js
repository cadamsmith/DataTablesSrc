import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test.describe('map()', () => {
  test('Check the defaults', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await test.step('Exists and is a function', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
      const type = await page.evaluate(() => typeof window.table.map);
      expect(type).toBe('function');
    });
    await test.step('Returns whatever function returns', async () => {
      const isApi = await page.evaluate(() => {
        let params;
        let count = 0;
        const result = window.table.column(3).data().map(function() {
          params = arguments;
          count++;
          return 0;
        });
        window._mapParams = params;
        window._mapCount = count;
        return result instanceof $.fn.dataTable.Api;
      });
      expect(isApi).toBe(true);
    });
    await test.step('Correct params to function', async () => {
      const [count, paramsLen, param0Type, param1Type, param2Api] = await page.evaluate(() => {
        const params = window._mapParams;
        const count = window._mapCount;
        return [
          count,
          params.length,
          typeof params[0],
          typeof params[1],
          params[2] instanceof $.fn.dataTable.Api
        ];
      });
      expect(count).toBe(57);
      expect(paramsLen).toBe(3);
      expect(param0Type).toBe('string');
      expect(param1Type).toBe('number');
      expect(param2Api).toBe(true);
    });
  });

  test('Functional tests', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await test.step('Check all values are mapped', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
      const result = await page.evaluate(() => {
        const dataMap = window.table.column(0).data().map(function(value, index) {
          return index + ' ' + value;
        });
        const dataCol = window.table.column(0).data();
        return Array.from({ length: 57 }, (_, i) => dataMap[i] === i + ' ' + dataCol[i]);
      });
      for (let i = 0; i < 57; i++) {
        expect(result[i]).toBe(true);
      }
    });
  });
});
