import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test.describe('reduceRight()', () => {
  test('Check the defaults', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await test.step('Exists and is a function', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
      const type = await page.evaluate(() => typeof window.table.reduceRight);
      expect(type).toBe('function');
    });
    await test.step('Returns whatever function returns', async () => {
      const isTrue = await page.evaluate(() => {
        let params;
        const result = window.table.column(0).data().reduceRight(function() {
          params = arguments;
          window._reduceRightParams = params;
          return true;
        });
        return result;
      });
      expect(isTrue).toBe(true);
    });
    await test.step('Correct params to function', async () => {
      const [len, t0, t1, t2, t3] = await page.evaluate(() => {
        const params = window._reduceRightParams;
        return [
          params.length,
          typeof params[0],
          typeof params[1],
          typeof params[2],
          params[3] instanceof $.fn.dataTable.Api
        ];
      });
      expect(len).toBe(4);
      expect(t0).toBe('boolean');
      expect(t1).toBe('string');
      expect(t2).toBe('number');
      expect(t3).toBe(true);
    });
  });

  test('Functional tests', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await test.step('Reducing 1d data', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
      const result = await page.evaluate(() => {
        let count = 0;
        const reduced = window.table.column(0).data().reduceRight(function(acc, value, idx) {
          count++;
          return acc + (value ? 1 : 0);
        }, 0);
        return { reduced, count };
      });
      expect(result.count).toBe(57);
      expect(result.reduced).toBe(57);
    });
  });
});
