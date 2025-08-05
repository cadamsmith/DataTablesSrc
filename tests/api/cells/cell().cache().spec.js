import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test.describe('cells - cell().cache()', () => {
  test('Check the defaults', async ({ page }) => {
    await loadTestPage(page, 'basic');

    await test.step('Exists and is a function', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });

      const type = await page.evaluate(() => typeof window.table.cell().cache);
      expect(type).toBe('function');
    });

    await test.step('Returns a string', async () => {
      const type = await page.evaluate(() => typeof window.table.cell().cache('search'));
      expect(type).toBe('string');
    });

    await test.step('Defaults to "order"', async () => {
      const value = await page.evaluate(() => window.table.cell(2, 0).cache());
      expect(value).toBe('ashton cox');
    });

    await test.step('undefined if not ordered yet', async () => {
      const value = await page.evaluate(() => window.table.cell(2, 1).cache());
      expect(value).toBe(undefined);
    });
  });

  test('Functional tests - standard', async ({ page }) => {
    await loadTestPage(page, 'basic');

    await test.step('Default', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });

      const actual = await page.evaluate(() => window.table.cell(2, 0).cache());
      expect(actual).toBe('ashton cox');
    });

    await test.step('search', async () => {
      const actual = await page.evaluate(() => window.table.cell(2, 0).cache('search'));
      expect(actual).toBe('Ashton Cox');
    });

    await test.step('order', async () => {
      const actual = await page.evaluate(() => window.table.cell(2, 0).cache('order'));
      expect(actual).toBe('ashton cox');
    });

    await test.step('cache updated if data changed - before draw', async () => {
      await page.evaluate(() => {
        window.table.cell(2, 0).data('Ashton Coxxx');
      });

      // failing due to DD-944
      // const actual = await page.evaluate(() => window.table.cell(2, 0).cache('search'));
      // expect(actual).toBe('ashton cox');
    });

    await test.step('cache updated if data changed - after draw', async () => {
      await page.evaluate(() => {
        window.table.draw();
      });

      const actual = await page.evaluate(() => window.table.cell(2, 0).cache());
      expect(actual).toBe('ashton coxxx');
    });

    await test.step('cache updated if data changed and cell invalidated - before draw', async () => {
      await page.evaluate(() => {
        $('tbody tr:eq(2) td:eq(0)').html('Ashtonnn');
        window.table.cell(2, 0).invalidate();
      });

      // failing due to DD-944
      // const actual = await page.evaluate(() => window.table.cell(2, 0).cache());
      // expect(actual).toBe('ashtonnn');
    });

    await test.step('cache updated if data changed and cell invalidated - after draw', async () => {
      await page.evaluate(() => {
        window.table.draw();
      });

      const actual = await page.evaluate(() => window.table.cell(2, 0).cache());
      expect(actual).toBe('ashtonnn');
    });
  });

  test('Functional tests - render', async ({ page }) => {
    await loadTestPage(page, 'basic');

    await test.step('Default', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable({
          columnDefs: [
            {
              targets: 0,
              render: function(data, type, row, meta) {
                if (type === 'filter') return 'Filter ' + data;
                if (type === 'sort') return 'Sort ' + data;

                return data;
              }
            }
          ]
        });
      });

      const actual = await page.evaluate(() => window.table.cell(2, 0).cache());
      expect(actual).toBe('sort ashton cox');
    });

    await test.step('search', async () => {
      const actual = await page.evaluate(() => window.table.cell(2, 0).cache('search'));
      expect(actual).toBe('Filter Ashton Cox');
    });

    await test.step('order', async () => {
      const actual = await page.evaluate(() => window.table.cell(2, 0).cache());
      expect(actual).toBe('sort ashton cox');
    });

    await test.step('cache updated if data changed - before draw', async () => {
      await page.evaluate(() => {
        window.table.cell(2, 0).data('Ashton Coxxx');
      });

      // failing due to DD-944
      // const actual = await page.evaluate(() => window.table.cell(2, 0).cache('search'));
      // expect(actual).toBe('sort ashton cox');
    });

    await test.step('cache updated if data changed - after draw', async () => {
      await page.evaluate(() => window.table.draw());

      const actual = await page.evaluate(() => window.table.cell(2, 0).cache());
      expect(actual).toBe('sort ashton coxxx');
    });

    await test.step('cache updated if data changed and cell invalidated - before draw', async () => {
      await page.evaluate(() => {
        $('tbody tr:eq(2) td:eq(0)').html('Ashtonnn');
        window.table.cell(2, 0).invalidate();
      });

      // failing due to DD-944
      // const actual = await page.evaluate(() => window.table.cell(2, 0).cache());
      // expect(actual).toBe('sort ashtonnn');
    });

    await test.step('cache updated if data changed and cell invalidated - after draw', async () => {
      await page.evaluate(() => window.table.draw());

      const actual = await page.evaluate(() => window.table.cell(2, 0).cache());
      expect(actual).toBe('sort ashtonnn');
    });
  });

  test('Functional tests - html5', async ({ page }) => {
    await loadTestPage(page, 'html5');

    await test.step('Default - only filter', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });

      const actual = await page.evaluate(() => window.table.cell(2, 0).cache());
      expect(actual).toBe('ashton cox');
    });

    await test.step('search - only filter', async () => {
      const actual = await page.evaluate(() => window.table.cell(2, 0).cache('search'));
      expect(actual).toBe('Filter Ashton Cox');
    });

    await test.step('order - only filter', async () => {
      const actual = await page.evaluate(() => window.table.cell(2, 0).cache('order'));
      expect(actual).toBe('ashton cox');
    });

    await test.step('Default - only sort', async () => {
      await page.evaluate(() => window.table.order([1, 'asc']).draw());

      const actual = await page.evaluate(() => window.table.cell(2, 1).cache());
      expect(actual).toBe('order junior technical author');
    });

    await test.step('search - only sort', async () => {
      const actual = await page.evaluate(() => window.table.cell(2, 1).cache('search'));
      expect(actual).toBe('Junior Technical Author');
    });

    await test.step('Default - only sort', async () => {
      const actual = await page.evaluate(() => window.table.cell(2, 1).cache());
      expect(actual).toBe('order junior technical author');
    });

    await test.step('cache updated if data changed - before draw', async () => {
      await page.evaluate(() => {
        window.table.order([0, 'asc']).draw();
        window.table.cell(2, 0).data('Ashton Coxxx');
      });

      // failing due to DD-944
      // const actual = await page.evaluate(() => window.table.cell(2, 0).cache('search'));
      // expect(actual).toBe('Filter Ashton Cox');
    });

    await test.step('cache updated if data changed - after draw', async () => {
      await page.evaluate(() => window.table.draw());

      const actual = await page.evaluate(() => window.table.cell(2, 0).cache('search'));
      expect(actual).toBe('Filter Ashton Cox');
    });

    await test.step('cache updated if data changed and cell invalidated - before draw', async () => {
      await page.evaluate(() => {
        $('tbody tr:eq(2) td:eq(0)').html('Ashtonnn');
        window.table.cell(2, 0).invalidate();
      });

      // failing due to DD-944
      // const actual = await page.evaluate(() => window.table.cell(2, 0).cache('search'));
      // expect(actual).toBe('Filter Ashton Cox');
    });

    await test.step('cache updated if data changed and cell invalidated - after draw', async () => {
      await page.evaluate(() => window.table.draw());

      const actual = await page.evaluate(() => window.table.cell(2, 0).cache('search'));
      expect(actual).toBe('Filter Ashton Cox');
    });
  });
});
