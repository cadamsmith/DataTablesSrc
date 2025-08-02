import { expect, test } from '@playwright/test';
import { loadTestPage } from '../../helpers.js';

test.describe('core - ajax.json()', () => {
  test('Check the defaults', async ({ page }) => {
    await loadTestPage(page, 'basic');

    await test.step('Exists and is a function', async () => {
      const type = await page.evaluate(() => {
        window.table = $('#example').DataTable();
        return typeof window.table.ajax.json;
      });
      expect(type).toBe('function');
    });

    await test.step('Returns undefined if DOM data', async () => {
      const type = await page.evaluate(() => typeof window.table.ajax.json());
      expect(type).toBe('undefined');
    });
  });

  test('Functional old-tests', async ({ page }) => {
    await loadTestPage(page, 'empty');

    await test.step('Returns object', async () => {
      const result = await page.evaluate(() => {
        return new Promise((resolve) => {
          window.table = $('#example').DataTable({
            ajax: '/tests/data/data.txt',
            columns: [
              { data: 'name' },
              { data: 'position' },
              { data: 'office' },
              { data: 'age' },
              { data: 'start_date' },
              { data: 'salary' },
            ],
            initComplete: function () {
              resolve(typeof window.table.ajax.json());
            },
          });
        });
      });
      expect(result).toBe('object');
    });

    await test.step('Returns correct data', async () => {
      const data = await page.evaluate(() => window.table.ajax.json());
      expect(data.data.length).toBe(57);
      expect(data.data[2].name).toBe('Ashton Cox');
    });

    await test.step('Change URL and confirm it gets the new data', async () => {
      await page.evaluate(() => {
        window.table.ajax.url('/tests/data/data_small.txt').load();
      });

      await page.waitForTimeout(1000);

      const data = await page.evaluate(() => window.table.ajax.json());
      expect(data.data.length).toBe(2);
      expect(data.data[1].name).toBe('Winter Jenkins');
    });

    await loadTestPage(page, 'empty');

    await test.step('Returns undefined if ajax is a function', async () => {
      const result = await page.evaluate(() => {
        return new Promise((resolve) => {
          window.table = $('#example').DataTable({
            ajax: function (data, callback) {
              let out = [];
              for (let i = 0; i < 2; i++) {
                out.push([
                  i + '-1',
                  i + '-2',
                  i + '-3',
                  i + '-4',
                  i + '-5',
                  i + '-6',
                ]);
              }

              setTimeout(function () {
                callback({
                  data: out,
                });
              }, 50);
            },
            initComplete: function () {
              resolve(window.table.ajax.json());
            },
          });
        });
      });

      expect(result).toEqual({
        data: [
          ['0-1', '0-2', '0-3', '0-4', '0-5', '0-6'],
          ['1-1', '1-2', '1-3', '1-4', '1-5', '1-6']
        ]
      });
    });
  });
});
