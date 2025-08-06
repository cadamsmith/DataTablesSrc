import { test, expect } from '@playwright/test';
import { loadTestPage } from '../helpers';

test('nonjQuery - ajax', async ({ page }) => {
  await loadTestPage(page, 'basic');

  await test.step('No options', async () => {
    const [rowCount, trCount] = await page.evaluate(() => {
      return new Promise((resolve) => {
        window.table = new DataTable('#example', {
          ajax: function(d, cb) {
            fetch('/tests/data/data.txt')
              .then(response => response.json())
              .then(data => cb(data));
          },
          columns: [
            {data: 'name'},
            {data: 'position'},
            {data: 'office'},
            {data: 'age'},
            {data: 'start_date'},
            {data: 'salary'}
          ],
          initComplete: function() {
            resolve([window.table.rows().count(), $('tbody tr').length]);
          }
        });
      });
    });

    expect(rowCount).toBe(57);
    expect(trCount).toBe(10);
  });

  await loadTestPage(page, 'basic');

  await test.step('No options', async () => {
    const [rowCount, trCount] = await page.evaluate(() => {
      return new Promise((resolve) => {
        window.table = new DataTable('#example', {
          ajax: function(d, cb) {
            fetch('/tests/data/data.txt')
              .then(response => response.json())
              .then(data => cb(data));
          },
          columns: [
            {data: 'name'},
            {data: 'position'},
            {data: 'office'},
            {data: 'age'},
            {data: 'start_date'},
            {data: 'salary'}
          ],
          paging: false,
          initComplete: function() {
            resolve([window.table.rows().count(), $('tbody tr').length]);
          }
        });
      });
    });

    expect(rowCount).toBe(57);
    expect(trCount).toBe(57);
  });
});
