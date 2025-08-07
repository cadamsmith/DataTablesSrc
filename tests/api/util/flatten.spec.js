import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test.describe('flatten()', () => {
  test('Check the defaults', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await test.step('Exists and is a function', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
      const type = await page.evaluate(() => typeof window.table.flatten);
      expect(type).toBe('function');
    });
    await test.step('Returns API instance', async () => {
      const isApi = await page.evaluate(() => window.table.flatten() instanceof $.fn.dataTable.Api);
      expect(isApi).toBe(true);
    });
  });

  test('Functional tests', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await test.step('init table', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
    });
    await test.step('Does nothing on 1D array', async () => {
      const result = await page.evaluate(() => {
        const data = window.table
          .rows(2)
          .data()
          .flatten();
        return {
          length: data.length,
          first: data[0]
        };
      });
      expect(result.length).toBe(6);
      expect(result.first).toBe('Ashton Cox');
    });
    await test.step('Flattens a 2D array with two arrays', async () => {
      const result = await page.evaluate(() => {
        const data = window.table.rows([2, 3]).data();
        return {
          length: data.length,
          flatLength: data.flatten().length,
          flat0: data.flatten()[0],
          flat6: data.flatten()[6]
        };
      });
      expect(result.length).toBe(2);
      expect(result.flatLength).toBe(12);
      expect(result.flat0).toBe('Ashton Cox');
      expect(result.flat6).toBe('Cedric Kelly');
    });
    await test.step('Flattens a 2D array with many arrays', async () => {
      const result = await page.evaluate(() => {
        const data = window.table.rows().data();
        return {
          length: data.length,
          flatLength: data.flatten().length,
          flat12: data.flatten()[12],
          flat18: data.flatten()[18]
        };
      });
      expect(result.length).toBe(57);
      expect(result.flatLength).toBe(342);
      expect(result.flat12).toBe('Ashton Cox');
      expect(result.flat18).toBe('Bradley Greer');
    });
  });
});