import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test.describe('cells - cell().index()', () => {
  test('Check the defaults', async ({ page }) => {
    await loadTestPage(page, 'basic');

    await test.step('Exists and is a function', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });

      const actual = await page.evaluate(() => typeof window.table.cell().index);
      expect(actual).toBe('function');
    });

    await test.step('Returns an object of Object type containing three integers', async () => {
      const index = await page.evaluate(() => {
        window.table = $('#example').DataTable();
        return window.table.cell().index();
      });

      expect(typeof index).toBe('object');
      expect(Object.keys(index).length).toBe(3);
      expect(Number.isInteger(index.row)).toBe(true);
      expect(Number.isInteger(index.column)).toBe(true);
      expect(Number.isInteger(index.columnVisible)).toBe(true);
    });
  });

  test('Returns correct information for hidden columns', async ({ page }) => {
    await loadTestPage(page, 'basic');

    await test.step('Returns correct information before hidden column', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });

      const index = await page.evaluate(() => {
        window.table.column(1).visible(false);
        return window.table.cell(0, 0).index();
      });

      expect(index.row).toBe(0);
      expect(index.column).toBe(0);
      expect(index.columnVisible).toBe(0);
    });

    await loadTestPage(page, 'basic');

    await test.step('Returns correct information for hidden column', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });

      const index = await page.evaluate(() => {
        window.table.column(1).visible(false);
        return window.table.cell(0, 1).index();
      });

      expect(index.row).toBe(0);
      expect(index.column).toBe(1);
      expect(index.columnVisible).toBe(null);
    });

    await loadTestPage(page, 'basic');

    await test.step('Returns correct information after hidden column', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });

      const index = await page.evaluate(() => {
        window.table.column(1).visible(false);
        return window.table.cell(0, 2).index();
      });

      expect(index.row).toBe(0);
      expect(index.column).toBe(2);
      expect(index.columnVisible).toBe(1);
    });
  });
});