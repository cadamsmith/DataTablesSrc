import { test, expect } from '@playwright/test';
import { clickHeader, loadTestPage } from '../../helpers';

test('Data type detection', async ({ page }) => {
  await loadTestPage(page, 'empty');
  await loadTestData(page);

  await test.step('Types detected as expected', async () => {
    await page.evaluate(() => {
      window.table = new DataTable('#example', {
        data: window.data
      });
    });

    const types = await page.evaluate(() => {
      return [
        window.table.column(0).type(),
        window.table.column(1).type(),
        window.table.column(2).type(),
        window.table.column(3).type(),
        window.table.column(4).type(),
        window.table.column(5).type()
      ];
    });

    expect(types).toEqual(['string', 'num', 'html-num', 'date', 'string', 'html']);
  });

  await test.step('Types detected when search and ordering disabled', async () => {
    await page.evaluate(() => {
      window.table = new DataTable('#example', {
        data: window.data,
        searching: false,
        ordering: false
      });
    });

    const types = await page.evaluate(() => {
      return [
        window.table.column(0).type(),
        window.table.column(1).type(),
        window.table.column(2).type(),
        window.table.column(3).type(),
        window.table.column(4).type(),
        window.table.column(5).type()
      ];
    });

    expect(types).toEqual(['string', 'num', 'html-num', 'date', 'string', 'html']);
  });

  // Data types after an invalidation
  // https://github.com/DataTables/ColReorder/issues/90
  await loadTestPage(page, 'empty');
  await loadTestData(page);

  await test.step('Types detected as expected on start up', async () => {
    await page.evaluate(() => {
      window.table = new DataTable('#example', {
        data: window.data
      });
    });

    const actual = await page.evaluate(() => window.table.column(3).type());
    expect(actual).toEqual('date');
  });

  await test.step('Invalidate data causes type to be null', async () => {
    await page.evaluate(() => {
      window.table.cell(0, 3).invalidate('data');
    });

    const actual = await page.evaluate(() => window.table.settings()[0].aoColumns[3].sType);
    expect(actual).toBeNull();
  });

  await test.step('Ordering by the column resolves type', async () => {
    await clickHeader(page, 3);

    const actual = await page.evaluate(() => window.table.settings()[0].aoColumns[3].sType);
    expect(actual).toBe('date');
  });
});

async function loadTestData(page) {
  await page.evaluate(() => {
    window.data = [];
    for (let i = 0; i < 100; i++) {
      window.data.push(
        [
          'a', // plain string
          i, // number
          '<div>' + i + '</div>', // HTML number
          '2020-01-01', // Date
          'c' + i, // String
          '<div>d' + i + '</div>'
        ] // HTML
      );
    }
  });
}
