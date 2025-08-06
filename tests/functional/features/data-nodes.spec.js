import { test, expect } from '@playwright/test';
import { clickHeader, loadTestPage } from '../../helpers';

test('Node based data', async ({ page }) => {
  await loadTestPage(page, 'empty');
  await loadTestData(page);

  await test.step('Load DataTable', async () => {
    await page.evaluate(() => {
      window.dataSet.forEach((r) => {
        var div1 = document.createElement('div');
        div1.innerHTML = r[1];
        r[1] = div1;

        var div3 = document.createElement('div');
        div3.innerHTML = r[3];
        r[3] = div3;
      });

      window.table = $('#example').DataTable({
        data: window.dataSet
      });
    });

    const actual = await page.evaluate(() => $('tbody tr:first-child td:first-child').text());
    expect(actual).toBe('Airi Satou');
  });

  await test.step('Divs are present', async () => {
    const actual = await page.evaluate(() => $('tbody div').length);
    expect(actual).toBe(10);
  });

  await test.step('String sort on div column', async () => {
    await clickHeader(page, 1);

    const actual = await page.evaluate(() => $('tbody tr:first-child td:first-child').text());
    expect(actual).toBe('Garrett Winters');
  });

  await test.step('String reverse sort on div column', async () => {
    await clickHeader(page, 1);

    const actual = await page.evaluate(() => $('tbody tr:first-child td:first-child').text());
    expect(actual).toBe('Tiger Nixon');
  });

  await test.step('Number sort on div column', async () => {
    await clickHeader(page, 3);

    const actual = await page.evaluate(() => $('tbody tr:first-child td:first-child').text());
    expect(actual).toBe('Ashton Cox');
  });

  await test.step('Number reverse sort on div column', async () => {
    await clickHeader(page, 3);

    const actual = await page.evaluate(() => $('tbody tr:first-child td:first-child').text());
    expect(actual).toBe('Garrett Winters');
  });

  await test.step('String search on div column', async () => {
    await page.evaluate(() => {
      window.table.search('System').draw();
    });

    const actual = await page.evaluate(() => $('tbody tr:first-child td:first-child').text());
    expect(actual).toBe('Tiger Nixon');
  });

  await test.step('Number search on div column', async () => {
    await page.evaluate(() => {
      window.table.search('6224').draw();
    });

    const actual = await page.evaluate(() => $('tbody tr:first-child td:first-child').text());
    expect(actual).toBe('Cedric Kelly');
  });
});

async function loadTestData(page) {
  await page.evaluate(() => {
    window.dataSet = [
      [
        'Tiger Nixon',
        'System Architect',
        'Edinburgh',
        '5421',
        '2011/04/25',
        '$320,800'
      ],
      [
        'Garrett Winters',
        'Accountant',
        'Tokyo',
        '8422',
        '2011/07/25',
        '$170,750'
      ],
      [
        'Ashton Cox',
        'Junior Technical Author',
        'San Francisco',
        '1562',
        '2009/01/12',
        '$86,000'
      ],
      [
        'Cedric Kelly',
        'Senior Javascript Developer',
        'Edinburgh',
        '6224',
        '2012/03/29',
        '$433,060'
      ],
      ['Airi Satou', 'Accountant', 'Tokyo', '5407', '2008/11/28', '$162,700']
    ];
  });
}
