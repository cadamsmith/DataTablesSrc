import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test('DataTable.ext.classes.thead.row', async ({ page }) => {
  await loadTestPage(page, 'basic');

  await test.step('Default', async () => {
    const actual = await page.evaluate(() => DataTable.ext.classes.thead.row);
    expect(actual).toBe('');
  });

  await test.step('No class is added by default', async () => {
    await page.evaluate(() => {
      new DataTable('#example');
    });

    const actual = await page.evaluate(() => $('thead tr')[0].className);
    expect(actual).toBe('');
  });

  await loadTestPage(page, 'basic');

  await test.step('Can set a value and it is applied', async () => {
    await page.evaluate(() => {
      DataTable.ext.classes.thead.row = 'testRow';
      new DataTable('#example');
    });

    const actual = await page.evaluate(() => $('thead tr.testRow').length);
    expect(actual).toBe(1);
  });

  await loadTestPage(page, 'empty_no_header');

  await test.step('Can set a value and it is applied', async () => {
    await page.evaluate(() => {
      DataTable.ext.classes.thead.row = 'emptyTest';
      new DataTable('#example', {
        columns: [
          {
            title: 'First'
          }
        ],
        data: [ [1], [2], [3] ]
      });
    });

    const actual = await page.evaluate(() => $('thead tr.emptyTest').length);
    expect(actual).toBe(1);
  });
});