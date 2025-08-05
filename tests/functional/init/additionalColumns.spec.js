import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test('Empty DataTable', async ({ page }) => {
  await loadTestPage(page, 'basic');

  await test.step('DataTables can be initialised with an extra column', async () => {
    await page.evaluate(() => {
      new DataTable('#example', {
        columns: [
          null,
          null,
          null,
          null,
          null,
          null,
          { title: 'Title', defaultContent: 'Content' }
        ]
      });
    });

    // No JS errors occurred
    expect(true).toBe(true);
  });

  await test.step('Last title contains set title', async () => {
    const actual = await page.evaluate(() => $('thead tr:first-child th:last-child').text());
    expect(actual).toBe('Title');
  });

  await test.step('Last column contains default content', async () => {
    const actual = await page.evaluate(() => $('tbody tr:first-child td:last-child').text());
    expect(actual).toBe('Content');
  });

  await test.step('And first column is as expected', async () => {
    let actual = await page.evaluate(() => $('thead tr:first-child th:first-child').text());
    expect(actual).toBe('Name');

    actual = await page.evaluate(() => $('tbody tr:first-child td:first-child').text());
    expect(actual).toBe('Airi Satou');
  });

  await loadTestPage(page, 'empty');

  await test.step('Ajax - DataTables can be initialised with an extra column', async () => {
    await page.evaluate(() => {
      return new Promise((resolve) => {
        new DataTable('#example', {
          columns: [
            { data: 'name' },
            { data: 'position' },
            { data: 'office' },
            { data: 'start_date' },
            { data: 'salary' },
            { data: 'age'},
            { data: 'age', visible: false},
          ],
          ajax: "/tests/data/data.txt",
          columnDefs: [
            {targets: '.id'}
          ],
          initComplete: function () {
            resolve();
          }
        });
      });
    });

    expect(true).toEqual(true);
  });

  await test.step('Data as expected', async () => {
    let actual = await page.evaluate(() => $('thead tr:first-child th:first-child').text());
    expect(actual).toBe('Name');

    actual = await page.evaluate(() => $('tbody tr:first-child td:first-child').text());
    expect(actual).toBe('Airi Satou');
  });

  await test.step('Last column not visible', async () => {
    let actual = await page.evaluate(() => $('thead tr:first-child th').length);
    expect(actual).toBe(6);

    actual = await page.evaluate(() => $('tbody tr:first-child td').length);
    expect(actual).toBe(6);
  });
});
