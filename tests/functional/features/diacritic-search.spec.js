import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test('Diacritic searching', async ({ page }) => {
  await loadTestPage(page, 'basic');

  await test.step('Load DataTable', async () => {
    await page.evaluate(() => {
      // Set up some strings to test for
      $('tbody tr:nth-child(1) td:nth-child(2)').text('Crème Brulée');
      $('tbody tr:nth-child(2) td:nth-child(2)').text('Amélie');
      $('tbody tr:nth-child(3) td:nth-child(2)').text('āăąēîïĩíĝġńñšŝśûůŷ');
      $('tbody tr:nth-child(4) td:nth-child(2)').text('Kateřina');

      window.table = $('#example').DataTable();
    });

    const actual = await page.evaluate(() => window.table.page.info().recordsTotal);
    expect(actual).toBe(57);
  });

  await test.step('Search for non-diacritic string - 1', async () => {
    await page.evaluate(() => {
      window.table.search('creme').draw();
    });

    let actual = await page.evaluate(() => $('tbody tr:first-child td:first-child').text());
    expect(actual).toBe('Tiger Nixon');

    actual = await page.evaluate(() => window.table.rows({page: 'current'}).count());
    expect(actual).toBe(1);
  });

  await test.step('Search for non-diacritic string - 2', async () => {
    await page.evaluate(() => {
      window.table.search('amelie').draw();
    });

    let actual = await page.evaluate(() => $('tbody tr:first-child td:first-child').text());
    expect(actual).toBe('Garrett Winters');

    actual = await page.evaluate(() => window.table.rows({page: 'current'}).count());
    expect(actual).toBe(1);
  });

  await test.step('Search for non-diacritic string - 3', async () => {
    await page.evaluate(() => {
      window.table.search('aaaeiiiiggnnsssuuy').draw();
    });

    let actual = await page.evaluate(() => $('tbody tr:first-child td:first-child').text());
    expect(actual).toBe('Ashton Cox');

    actual = await page.evaluate(() => window.table.rows({page: 'current'}).count());
    expect(actual).toBe(1);
  });

  await test.step('Search for non-diacritic string - 4', async () => {
    await page.evaluate(() => {
      window.table.search('Katerina').draw();
    });

    let actual = await page.evaluate(() => $('tbody tr:first-child td:first-child').text());
    expect(actual).toBe('Cedric Kelly');

    actual = await page.evaluate(() => window.table.rows({page: 'current'}).count());
    expect(actual).toBe(1);
  });

  await test.step('Search for non-diacritic string - 1', async () => {
    await page.evaluate(() => {
      window.table.search('crème').draw();
    });

    let actual = await page.evaluate(() => $('tbody tr:first-child td:first-child').text());
    expect(actual).toBe('Tiger Nixon');

    actual = await page.evaluate(() => window.table.rows({page: 'current'}).count());
    expect(actual).toBe(1);
  });

  await test.step('Search for non-diacritic string - 2', async () => {
    await page.evaluate(() => {
      window.table.search('amélie').draw();
    });

    let actual = await page.evaluate(() => $('tbody tr:first-child td:first-child').text());
    expect(actual).toBe('Garrett Winters');

    actual = await page.evaluate(() => window.table.rows({page: 'current'}).count());
    expect(actual).toBe(1);
  });

  await test.step('Search for non-diacritic string - 3', async () => {
    await page.evaluate(() => {
      window.table.search('āăąēîïĩíĝġńñšŝśûůŷ').draw();
    });

    let actual = await page.evaluate(() => $('tbody tr:first-child td:first-child').text());
    expect(actual).toBe('Ashton Cox');

    actual = await page.evaluate(() => window.table.rows({page: 'current'}).count());
    expect(actual).toBe(1);
  });

  await test.step('Search for non-diacritic string - 4', async () => {
    await page.evaluate(() => {
      window.table.search('kateřina').draw();
    });

    let actual = await page.evaluate(() => $('tbody tr:first-child td:first-child').text());
    expect(actual).toBe('Cedric Kelly');

    actual = await page.evaluate(() => window.table.rows({page: 'current'}).count());
    expect(actual).toBe(1);
  });
});
