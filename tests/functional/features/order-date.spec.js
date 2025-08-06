import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test('Date ordering with empty dates', async ({ page }) => {
  await loadTestPage(page, 'two-column-empty');
  await loadTestData(page);

  await test.step('Load DataTable with local data', async () => {
    await page.evaluate(() => {
      window.table = $('#example').DataTable( {
        data: window.data
      });
    });

    let actual = await page.evaluate(() => $('tbody tr:eq(0) td:eq(0)').text());
    expect(actual).toBe('Alice');

    actual = await page.evaluate(() => $('tbody tr:eq(1) td:eq(0)').text());
    expect(actual).toBe('Bob');

    actual = await page.evaluate(() => $('tbody tr:eq(2) td:eq(0)').text());
    expect(actual).toBe('Charlie');
  });

  await test.step('Order by date column (asc)', async () => {
    await page.evaluate(() => {
      window.table.order( [[ 1, 'asc' ]] ).draw();
    });

    let actual = await page.evaluate(() => $('tbody tr:eq(0) td:eq(1)').text());
    expect(actual).toBe('');

    actual = await page.evaluate(() => $('tbody tr:eq(1) td:eq(1)').text());
    expect(actual).toBe('');

    actual = await page.evaluate(() => $('tbody tr:eq(2) td:eq(1)').text());
    expect(actual).toBe('1920-05-10');

    actual = await page.evaluate(() => $('tbody tr:eq(3) td:eq(1)').text());
    expect(actual).toBe('1969-12-30');

    actual = await page.evaluate(() => $('tbody tr:eq(4) td:eq(1)').text());
    expect(actual).toBe('1970-01-02');

    actual = await page.evaluate(() => $('tbody tr:eq(5) td:eq(1)').text());
    expect(actual).toBe('2012-12-12');
  });

  await test.step('Order by date column (desc)', async () => {
    await page.evaluate(() => {
      window.table.order( [[ 1, 'desc' ]] ).draw();
    });

    let actual = await page.evaluate(() => $('tbody tr:eq(5) td:eq(1)').text());
    expect(actual).toBe('');

    actual = await page.evaluate(() => $('tbody tr:eq(4) td:eq(1)').text());
    expect(actual).toBe('');

    actual = await page.evaluate(() => $('tbody tr:eq(3) td:eq(1)').text());
    expect(actual).toBe('1920-05-10');

    actual = await page.evaluate(() => $('tbody tr:eq(2) td:eq(1)').text());
    expect(actual).toBe('1969-12-30');

    actual = await page.evaluate(() => $('tbody tr:eq(1) td:eq(1)').text());
    expect(actual).toBe('1970-01-02');

    actual = await page.evaluate(() => $('tbody tr:eq(0) td:eq(1)').text());
    expect(actual).toBe('2012-12-12');
  });
});

async function loadTestData(page) {
  await page.evaluate(() => {
    window.data = [
      [ 'Alice', '1920-05-10' ],
      [ 'Bob', '1969-12-30' ],
      [ 'Charlie', '1970-01-02' ],
      [ 'Dan', '' ],
      [ 'Eve', '2012-12-12' ],
      [ 'Frank', '' ]
    ];
  });
}
