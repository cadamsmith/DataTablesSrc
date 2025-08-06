import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test('Empty DataTable', async ({ page }) => {
  await loadTestPage(page, 'basic');

  await test.step('Load DataTable', async () => {
    await page.evaluate(() => {
      window.table = $('#example').DataTable();
    });

    let actual = await page.evaluate(() => $('tbody tr:eq(0) td:eq(0)').text());
    expect(actual).toBe('Airi Satou');

    actual = await page.evaluate(() => [...window.table.column(0).header().classList]);
    expect(actual).toContain('dt-ordering-asc');

    actual = await page.evaluate(() => [...window.table.column(1).header().classList]);
    expect(actual).not.toContain('dt-ordering-asc');
  });

  await test.step('Order by hidden column', async () => {
    await page.evaluate(() => {
      window.table.column(1).visible(false);
      window.table.order([1, 'asc']).draw();
    });

    const actual = await page.evaluate(() => $('tbody tr:eq(0) td:eq(0)').text());
    expect(actual).toBe('Garrett Winters');
  });

  await test.step('Header cell classes are as expected', async () => {
    let actual = await page.evaluate(() => [...window.table.column(0).header().classList]);
    expect(actual).not.toContain('dt-ordering-asc');

    actual = await page.evaluate(() => [...window.table.column(1).header().classList]);
    expect(actual).toContain('dt-ordering-asc');
  });
});
