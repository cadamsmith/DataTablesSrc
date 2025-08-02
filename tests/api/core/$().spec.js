import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test.describe('core - $()', () => {
  test.beforeEach(async ({ page }) => {
    await loadTestPage(page, 'basic');
  });

  test('Check the defaults', async ({ page }) => {
    await test.step('Exists and is a function', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });

      const type = await page.evaluate(() => typeof window.table.$);
      expect(type).toBe('function');
    });

    await test.step('Returns a jQuery instance', async () => {
      const isJQuery = await page.evaluate(
        () => window.table.$('tr') instanceof $
      );
      expect(isJQuery).toBe(true);
    });
  });

  test('Functional tests', async ({ page }) => {
    await test.step('Selector - node', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
      const text = await page.evaluate(() =>
        window.table.$(window.table.cell(2, 0).node()).text()
      );
      expect(text).toBe('Ashton Cox');
    });

    await test.step('Selector - jQuery', async () => {
      const text = await page.evaluate(() =>
        window.table.$($('tbody tr:eq(2) td:eq(0)')).text()
      );
      expect(text).toBe('Ashton Cox');
    });

    await test.step('Selector - string', async () => {
      const text = await page.evaluate(() =>
        window.table.$('td:contains("Cox")').text()
      );
      expect(text).toBe('Ashton Cox');
    });

    await test.step('Modifier - none', async () => {
      const len = await page.evaluate(() => window.table.$('tr').length);
      expect(len).toBe(57);
    });

    await test.step('Modifier - page', async () => {
      const len = await page.evaluate(
        () => window.table.$('tr', { page: 'current' }).length
      );
      expect(len).toBe(10);
    });

    await test.step('Modifier - order - original', async () => {
      const firstWord = await page.evaluate(
        () =>
          window.table
            .$('tr:eq(0)', { order: 'original' })
            .text()
            .trim()
            .split(' ')[0]
      );
      expect(firstWord).toBe('Tiger');
    });

    await test.step('Modifier - order - current', async () => {
      const firstWord = await page.evaluate(
        () =>
          window.table
            .$('tr:eq(0)', { order: 'current' })
            .text()
            .trim()
            .split(' ')[0]
      );
      expect(firstWord).toBe('Airi');
    });
  });
});
