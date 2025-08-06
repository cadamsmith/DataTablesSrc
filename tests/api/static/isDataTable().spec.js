import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test.describe('Static method - isDataTable()', () => {
  test('Check the defaults', async ({ page }) => {
    await loadTestPage(page, 'basic');

    await test.step('Exists and is a function', async () => {
      await page.evaluate(() => {
        $('#test').DataTable();
      });

      let actual = await page.evaluate(() => typeof $.fn.dataTable.isDataTable);
      expect(actual).toBe('function');

      actual = await page.evaluate(() => typeof DataTable.isDataTable);
      expect(actual).toBe('function');
    });

    await test.step('Returns a boolean', async () => {
      let actual = await page.evaluate(() => typeof $.fn.dataTable.isDataTable());
      expect(actual).toBe('boolean');

      actual = await page.evaluate(() => typeof DataTable.isDataTable());
      expect(actual).toBe('boolean');
    });
  });

  test('Functional tests (with both DataTable and $.fn.dataTable)', async ({ page }) => {
    await loadTestPage(page, 'basic');

    await test.step('Returns false before initialization', async () => {
      let actual = await page.evaluate(() => $.fn.dataTable.isDataTable($('#example')));
      expect(actual).toBe(false);

      actual = await page.evaluate(() => DataTable.isDataTable($('#example')));
      expect(actual).toBe(false);
    });

    await test.step('Accepts a DataTable table node', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });

      let actual = await page.evaluate(() => $.fn.dataTable.isDataTable($('#example')));
      expect(actual).toBe(true);

      actual = await page.evaluate(() => DataTable.isDataTable($('#example')));
      expect(actual).toBe(true);
    });

    await test.step('Other nodes return false', async () => {
      let actual = await page.evaluate(() => $.fn.dataTable.isDataTable($('th').get(0)));
      expect(actual).toBe(false);

      actual = await page.evaluate(() => $.fn.dataTable.isDataTable($('td').get(0)));
      expect(actual).toBe(false);

      actual = await page.evaluate(() => $.fn.dataTable.isDataTable($('div').get(0)));
      expect(actual).toBe(false);

      actual = await page.evaluate(() => DataTable.isDataTable($('th').get(0)));
      expect(actual).toBe(false);

      actual = await page.evaluate(() => DataTable.isDataTable($('td').get(0)));
      expect(actual).toBe(false);

      actual = await page.evaluate(() => DataTable.isDataTable($('div').get(0)));
      expect(actual).toBe(false);
    });

    await test.step('Can accept a jQuery selector', async () => {
      let actual = await page.evaluate(() => $.fn.dataTable.isDataTable('table.dataTable'));
      expect(actual).toBe(true);

      actual = await page.evaluate(() => $.fn.dataTable.isDataTable('div'));
      expect(actual).toBe(false);

      actual = await page.evaluate(() => DataTable.isDataTable('table.dataTable'));
      expect(actual).toBe(true);

      actual = await page.evaluate(() => DataTable.isDataTable('div'));
      expect(actual).toBe(false);
    });

    await test.step('Can accept a DataTable API instance', async () => {
      let actual = await page.evaluate(() => $.fn.dataTable.isDataTable(window.table));
      expect(actual).toBe(true);

      actual = await page.evaluate(() => $.fn.dataTable.isDataTable(1));
      expect(actual).toBe(false);

      actual = await page.evaluate(() => DataTable.isDataTable(window.table));
      expect(actual).toBe(true);

      actual = await page.evaluate(() => DataTable.isDataTable(1));
      expect(actual).toBe(false);
    });

    await loadTestPage(page, 'basic');

    await test.step('Returns true for the header in a scrolling table', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable({
          scrollY: 200
        });
      });

      const actual = await page.evaluate(() => {
        const scrollingTable = $(window.table.table().header()).closest('table');
        return $.fn.dataTable.isDataTable(scrollingTable);
      });

      expect(actual).toBe(true);
    });

    await test.step('Returns true for the body in a scrolling table', async () => {
      const actual = await page.evaluate(() => {
        const scrollingTable = $(window.table.table().body()).closest('table');
        return $.fn.dataTable.isDataTable(scrollingTable);
      });

      expect(actual).toBe(true);
    });

    await test.step('Returns true for the footer in a scrolling table', async () => {
      const actual = await page.evaluate(() => {
        const scrollingTable = $(window.table.table().footer()).closest('table');
        return $.fn.dataTable.isDataTable(scrollingTable);
      });

      expect(actual).toBe(true);
    });
  });
});

