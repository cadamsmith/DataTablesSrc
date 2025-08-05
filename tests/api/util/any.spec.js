import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test.describe('any()', () => {
  test('Check the defaults', async ({ page }) => {
    await loadTestPage(page, 'basic');

    await test.step('Exists and is a function', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });

      const type = await page.evaluate(() => typeof window.table.any);
      expect(type).toBe('function');
    });

    await test.step('Returns API instance', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });

      const type = await page.evaluate(() => typeof window.table.any());
      expect(type).toBe('boolean');
    });
  });

  test('Functional tests', async ({ page }) => {
    await loadTestPage(page, 'basic');

    await test.step('1D array true', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });

      const actual = await page.evaluate(() => window.table.row(2).any());
      expect(actual).toBe(true);
    });

    await test.step('2D array true', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });

      const actual = await page.evaluate(() => window.table.row([3, 4]).any());
      expect(actual).toBe(true);
    });

    await test.step('2D array false', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });

      const actual = await page.evaluate(() => window.table.row([63, 64]).any());
      expect(actual).toBe(false);
    });

    await test.step('2D array mixed', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });

      const actual = await page.evaluate(() => window.table.row([6, 64]).any());
      expect(actual).toBe(true);
    });
  });
});