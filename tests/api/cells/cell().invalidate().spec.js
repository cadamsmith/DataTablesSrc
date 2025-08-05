import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test.describe('cells - cell().invalidate()', () => {
  test('Check the defaults', async ({ page }) => {
    await loadTestPage(page, 'basic');

    await test.step('Exists and is a function', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });

      const actual = await page.evaluate(() => typeof window.table.cell().invalidate);
      expect(actual).toBe('function');
    });

    await test.step('Returns an API instance', async () => {
      const actual = await page.evaluate(() => window.table.cell().invalidate() instanceof $.fn.dataTable.Api);
      expect(actual).toBe(true);
    });
  });

  test('Functional tests - DOM sourced', async ({ page }) => {
    await loadTestPage(page, 'basic');

    await test.step('Update value in the table', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });

      await page.evaluate(() => {
        $('#example tbody tr:eq(2) td:eq(0)').text('Fred');
      });

      let actual = await page.evaluate(() => $('#example tbody tr:eq(2) td:eq(0)').text());
      expect(actual).toBe('Fred');

      actual = await page.evaluate(() => window.table.cell(2, 0).data());
      expect(actual).toBe('Ashton Cox');
    });

    await test.step('Changed when invalidated', async () => {
      await page.evaluate(() => {
        window.table.cell(2, 0).invalidate();
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

    await test.step('Column renderer is not called', async () => {
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
        $('#example tbody tr:eq(2) td:eq(0)').text('Fred');
        window.table.cell(2, 0).invalidate();
      });

      const actual = await page.evaluate(() => $('#example tbody tr:eq(2) td:eq(0)').text());
      expect(actual).toBe('Fred');
    });

    await test.step('After the draw', async () => {
      await page.evaluate(() => window.table.draw());

      let actual = await page.evaluate(() => window.table.cell(2, 0).data());
      expect(actual).toBe('Fred');

      actual = await page.evaluate(() => window.table.cell(2, 0).cache('search'));
      expect(actual).toBe('FRED');
    });

    await loadTestPage(page, 'basic');

    await test.step('Use auto for the source', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });

      await page.evaluate(() => {
        const data = table.row(2).data();
        data[0] = 'Fred';
        window.table.cell(2, 0).invalidate('auto');
      });

      let actual = await page.evaluate(() => $('#example tbody tr:eq(2) td:eq(0)').text());
      expect(actual).toBe('Ashton Cox');

      actual = await page.evaluate(() => window.table.cell(2, 0).data());
      expect(actual).toBe('Ashton Cox');
    });

    await test.step('Use data for the source', async () => {
      await page.evaluate(() => {
        const data = window.table.row(2).data();
        data[0] = 'Fred';
        window.table.cell(2, 0).invalidate('data');
      });

      let actual = await page.evaluate(() => $('#example tbody tr:eq(2) td:eq(0)').text());
      expect(actual).toBe('Fred');

      actual = await page.evaluate(() => window.table.cell(2, 0).data());
      expect(actual).toBe('Fred');
    });

    await test.step('Use data for the source', async () => {
      await page.evaluate(() => {
        const data = window.table.row(2).data();
        data[0] = 'Stan';
        window.table.cell(2, 0).invalidate('dom');
      });

      let actual = await page.evaluate(() => $('#example tbody tr:eq(2) td:eq(0)').text());
      expect(actual).toBe('Fred');

      actual = await page.evaluate(() => window.table.cell(2, 0).data());
      expect(actual).toBe('Fred');
    });
  });

  test('Functional tests - JS sourced', async ({ page }) => {
    await loadTestPage(page, 'empty');

    await test.step('Load data', async () => {
      await page.evaluate(() => {
        return new Promise((resolve) => {
          window.table = $('#example').DataTable({
            ajax: '/tests/data/array.txt',
            deferRender: true,
            initComplete: function () {
              resolve();
            },
          });
        });
      });
    });

    await test.step('Update row data', async () => {
      await page.evaluate(() => {
        const data = window.table.row(2).data();
        data[0] = 'Fred';
      });

      let actual = await page.evaluate(() => $('#example tbody tr:eq(2) td:eq(0)').text());
      expect(actual).toBe('Ashton Cox');

      actual = await page.evaluate(() => window.table.cell(2, 0).data());
      expect(actual).toBe('Fred');
    });

    await test.step('Changed when invalidated', async () => {
      await page.evaluate(() => {
        window.table.cell(2, 0).invalidate();
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

    await loadTestPage(page, 'empty');

    await test.step('Load data', async () => {
      await page.evaluate(() => {
        return new Promise((resolve) => {
          window.table = $('#example').DataTable({
            ajax: '/tests/data/array.txt',
            deferRender: true,
            initComplete: function () {
              resolve();
            },
          });
        });
      });
    });

    await test.step('Use auto for the source', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
        $('#example tbody tr:eq(2) td:eq(0)').text('Fred');
        window.table.cell(2, 0).invalidate('auto');
      });

      let actual = await page.evaluate(() => $('#example tbody tr:eq(2) td:eq(0)').text());
      expect(actual).toBe('Ashton Cox');

      actual = await page.evaluate(() => window.table.cell(2, 0).data());
      expect(actual).toBe('Ashton Cox');
    });

    await test.step('Use data for the source', async () => {
      await page.evaluate(() => {
        $('#example tbody tr:eq(2) td:eq(0)').text('Fred');
        window.table.cell(2, 0).invalidate('data');
      });

      let actual = await page.evaluate(() => $('#example tbody tr:eq(2) td:eq(0)').text());
      expect(actual).toBe('Ashton Cox');

      actual = await page.evaluate(() => window.table.cell(2, 0).data());
      expect(actual).toBe('Ashton Cox');
    });

    await test.step('Use dom for the source', async () => {
      await page.evaluate(() => {
        $('#example tbody tr:eq(2) td:eq(0)').text('Fred');
        window.table.cell(2, 0).invalidate('dom');
      });

      let actual = await page.evaluate(() => $('#example tbody tr:eq(2) td:eq(0)').text());
      expect(actual).toBe('Fred');

      actual = await page.evaluate(() => window.table.cell(2, 0).data());
      expect(actual).toBe('Fred');
    });
  });
});