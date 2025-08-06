import { test, expect } from '@playwright/test';
import { loadTestPage } from '../helpers';

test('nonJQuery - events', async ({ page }) => {
  await loadTestPage(page, 'basic');

  await test.step('No options', async () => {
    await page.evaluate(() => {
      window.table = new DataTable('#example');

      window.data = {
        event: '',
        order: 0,
        page: 0
      };

      window.table
        .on('order', function () {
          window.data.event = 'Order';
          window.data.order++;
        })
        .on('search', function () {
          window.data.event = 'Search';
        })
        .on('page', function () {
          window.data.event = 'Page';
          window.data.page++;
        });
    });

    const actual = await page.evaluate(() => window.data.event);
    expect(actual).toBe('');
  });

  await test.step('Order', async () => {
    await page.evaluate(() => window.table.order(1).draw());

    let actual = await page.evaluate(() => window.data.event);
    expect(actual).toBe('Search');

    actual = await page.evaluate(() => window.data.order);
    expect(actual).toBe(1);
  });

  await test.step('Search', async () => {
    await page.evaluate(() => window.table.search('a'));

    const actual = await page.evaluate(() => window.data.event);
    expect(actual).toBe('Search');
  });

  await test.step('Page', async () => {
    await page.evaluate(() => {
      window.table.search('').draw();
      window.table.page(2);
    });

    let actual = await page.evaluate(() => window.data.page);
    expect(actual).toBe(1);

    actual = await page.evaluate(() => window.data.event);
    expect(actual).toBe('Page');
  });
});
