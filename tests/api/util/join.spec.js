import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test.describe('join()', () => {
  test('Check the defaults', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await test.step('Exists and is a function', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
      const type = await page.evaluate(() => typeof window.table.join);
      expect(type).toBe('function');
    });
    await test.step('Returns string', async () => {
      const val = await page.evaluate(() => typeof window.table.column(0).data().join(' '));
      expect(val).toBe('string');
    });
  });

  test('Functional tests', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await test.step('Joining 1d data', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
      const data = await page.evaluate(() => window.table.row(2).data().join(' X '));
      expect(data).toBe('Ashton Cox X Junior Technical Author X San Francisco X 66 X 2009/01/12 X $86,000');
    });
    await test.step('Joining 2d data', async () => {
      const data = await page.evaluate(() => {
        return window.table.rows([0, 2]).data().join(' X ');
      });
      expect(data).toBe(
        'Ashton Cox,Junior Technical Author,San Francisco,66,2009/01/12,$86,000 X Tiger Nixon,System Architect,Edinburgh,61,2011/04/25,$320,800'
      );
    });
  });
});
