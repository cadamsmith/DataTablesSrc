import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test.describe('cells - cell().data()', () => {
  test('Check the defaults', async ({ page }) => {
    await loadTestPage(page, 'basic');

    await test.step('Exists and is a function', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });

      const actual = await page.evaluate(() => typeof window.table.cell().data);
      expect(actual).toBe('function');
    });

    await test.step('Getter returns an array', async () => {
      const actual = await page.evaluate(() => typeof window.table.cell().data());
      expect(actual).toBe('string');
    });

    await test.step('Setter returns an API instance', async () => {
      const actual = await page.evaluate(() => window.table.cell().data('Fred') instanceof $.fn.dataTable.Api);
      expect(actual).toBe(true);
    });
  });

  test('Functional tests - Getter', async ({ page }) => {
    await loadTestPage(page, 'basic');

    await test.step('Returns expected data', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });

      const actual = await page.evaluate(() => window.table.cell(2, 0).data());
      expect(actual).toBe('Ashton Cox');
    });

    await loadTestPage(page, 'basic');

    await test.step('Returns original data, not rendered', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable({
          columnDefs: [
            {
              targets: 0,
              render: function(data) {
                return data.toUpperCase();
              }
            }
          ]
        });
      });

      let actual = await page.evaluate(() => $('#example tbody tr:eq(2) td:eq(0)').text());
      expect(actual).toBe('ASHTON COX');

      actual = await page.evaluate(() => window.table.cell(2, 0).data());
      expect(actual).toBe('Ashton Cox');
    });
  });


  test('Functional tests - Setter', async ({ page }) => {
    await loadTestPage(page, 'basic');

    await test.step('Updates before the draw', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });

      await page.evaluate(() => {
        window.table.cell(2, 0).data('Fred');
      });

      let actual = await page.evaluate(() => $('#example tbody tr:eq(2) td:eq(0)').text());
      expect(actual).toBe('Fred');

      actual = await page.evaluate(() => window.table.cell(2, 0).data());
      expect(actual).toBe('Fred');
    });

    await test.step('Draw causes a reordering', async () => {
      await page.evaluate(() => window.table.draw());

      let actual = await page.evaluate(() => $('#example tbody tr:eq(2) td:eq(0)').text());
      expect(actual).toBe('Bradley Greer');

      actual = await page.evaluate(() => window.table.cell(2, 0).data());
      expect(actual).toBe('Fred');
    });

    await test.step('Same number of rows (not duplicated)', async () => {
      const actual = await page.evaluate(() => window.table.rows().count());
      expect(actual).toBe(57);
    });

    await test.step('Ordering uses new value', async () => {
      await page.evaluate(() => {
        window.table.page(1).draw(false);
      });

      const actual = await page.evaluate(() => $('#example tbody tr:eq(6) td:eq(0)').text());
      expect(actual).toBe('Fred');
    });

    await test.step('Filtering uses new value', async () => {
      await page.evaluate(() => {
        window.table.search('Fred').draw();
      });

      let actual = await page.evaluate(() => $('#example tbody tr').length);
      expect(actual).toBe(1);

      actual = await page.evaluate(() => $('#example tbody tr:eq(0) td:eq(0)').text());
      expect(actual).toBe('Fred');
    });

    await loadTestPage(page, 'basic');

    await test.step('Column renderer is still called', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable({
          columnDefs: [
            {
              targets: 0,
              render: function(data) {
                return data.toUpperCase();
              }
            }
          ]
        });
      });

      await page.evaluate(() => {
        window.table.cell(2, 0).data('Fred');
      });

      let actual = await page.evaluate(() => $('#example tbody tr:eq(2) td:eq(0)').text());
      expect(actual).toBe('FRED');

      actual = await page.evaluate(() => window.table.cell(2, 0).data());
      expect(actual).toBe('Fred');
    });
  });
});