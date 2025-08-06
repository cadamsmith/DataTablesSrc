import { test, expect } from '@playwright/test';
import { clickHeader, loadTestPage } from '../../helpers';

test('Stable and reset sort', async ({ page }) => {
  await loadTestPage(page, 'stable-sort');

  await test.step('Load DataTable', async () => {
    await page.evaluate(() => {
      window.table = $('#example').DataTable();
    });

    let actual = await page.evaluate(() => $('tbody tr:eq(0) td:eq(0)').text());
    expect(actual).toBe('2020-10-28');

    actual = await page.evaluate(() => $('tbody tr:eq(0) td:eq(1)').text());
    expect(actual).toBe('5. James');

    actual = await page.evaluate(() => $('tbody tr:eq(1) td:eq(0)').text());
    expect(actual).toBe('2020-10-28');

    actual = await page.evaluate(() => $('tbody tr:eq(1) td:eq(1)').text());
    expect(actual).toBe('6. James');
  });

  await test.step('Sort on last column to mix first column\'s sort', async () => {
    await clickHeader(page, 2);

    let actual = await page.evaluate(() => $('tbody tr:eq(0) td:eq(0)').text());
    expect(actual).toBe('2023-11-12');

    actual = await page.evaluate(() => $('tbody tr:eq(0) td:eq(1)').text());
    expect(actual).toBe('2. James');

    actual = await page.evaluate(() => $('tbody tr:eq(1) td:eq(0)').text());
    expect(actual).toBe('2023-02-17');

    actual = await page.evaluate(() => $('tbody tr:eq(1) td:eq(1)').text());
    expect(actual).toBe('4. James');
  });

  await test.step('Load DataTable', async () => {
    await clickHeader(page, 0);

    let actual = await page.evaluate(() => $('tbody tr:eq(0) td:eq(0)').text());
    expect(actual).toBe('2020-10-28');

    actual = await page.evaluate(() => $('tbody tr:eq(0) td:eq(1)').text());
    expect(actual).toBe('5. James');

    actual = await page.evaluate(() => $('tbody tr:eq(1) td:eq(0)').text());
    expect(actual).toBe('2020-10-28');

    actual = await page.evaluate(() => $('tbody tr:eq(1) td:eq(1)').text());
    expect(actual).toBe('6. James');
  });
});
