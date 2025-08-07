import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test.describe('get()', () => {
  test('Check the defaults', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await test.step('Create DataTable', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
      // No assertion needed, matches legacy
      expect(true).toBe(true);
    });
    await test.step('get() method exists', async () => {
      const type = await page.evaluate(() => typeof window.table.get);
      expect(type).toBe('function');
    });
  });

  test('Functional tests', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await test.step('Create DataTable', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
    });
    await test.step('get() can select the first item from a result set', async () => {
      const d = await page.evaluate(() => window.table.column(0, {order:'applied'}).data().get(0));
      expect(d).toBe('Airi Satou');
    });
    await test.step('get() can select the second item from a result set', async () => {
      const d = await page.evaluate(() => window.table.column(0, {order:'applied'}).data().get(1));
      expect(d).toBe('Angelica Ramos');
    });
    await test.step('get() returns undefined for an undefined index', async () => {
      const d = await page.evaluate(() => window.table.column(0, {order:'applied'}).data().get(100));
      expect(d).toBe(undefined);
    });
    await test.step('get() returns undefined for a negative index', async () => {
      const d = await page.evaluate(() => window.table.column(0, {order:'applied'}).data().get(-1));
      expect(d).toBe(undefined);
    });
  });
});