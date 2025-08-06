import { test, expect } from '@playwright/test';
import { clickHeader, loadTestPage } from '../../helpers';

test('Diacritic ordering', async ({ page }) => {
  await loadTestPage(page, 'empty');

  await test.step('Type detection', async () => {
    await page.evaluate(() => {
      window.table = $('#example').empty().DataTable({
        columns: [
          {
            title: 'Test',
            data: 0
          }
        ],
        data: [
          ['Été'],
          ['sève'],
          ['À propos'],
          ['Schomberg'],
          ['Ökonomie'],
          ['étêter'],
          ['Oracle'],
          ['étirer'],
          ['Été'],
          ['Schön'],
          ['ethnie'],
          ['étoffe'],
          ['Schubert'],
        ]
      });
    });

    const actual = await page.evaluate(() => window.table.column(0).type());
    expect(actual).toBe('string-utf8');
  });

  await test.step('Ordering is as expected', async () => {
    const data = await page.evaluate(() => {
      return [
        $('tbody tr:eq(0) td').text(),
        $('tbody tr:eq(1) td').text(),
        $('tbody tr:eq(2) td').text(),
        $('tbody tr:eq(3) td').text(),
        $('tbody tr:eq(4) td').text(),
        $('tbody tr:eq(5) td').text(),
        $('tbody tr:eq(6) td').text(),
        $('tbody tr:eq(7) td').text(),
        $('tbody tr:eq(8) td').text(),
        $('tbody tr:eq(9) td').text()
      ];
    });

    expect(data).toEqual([
      'À propos',
      'Été',
      'Été',
      'étêter',
      'ethnie',
      'étirer',
      'étoffe',
      'Ökonomie',
      'Oracle',
      'Schomberg'
    ]);
  });

  await test.step('Ordering can be reversed', async () => {
    await clickHeader(page, 0);

    const data = await page.evaluate(() => {
      return [
        $('tbody tr:eq(9) td').text(),
        $('tbody tr:eq(8) td').text(),
        $('tbody tr:eq(7) td').text(),
        $('tbody tr:eq(6) td').text(),
        $('tbody tr:eq(5) td').text(),
        $('tbody tr:eq(4) td').text(),
        $('tbody tr:eq(3) td').text(),
        $('tbody tr:eq(2) td').text(),
        $('tbody tr:eq(1) td').text(),
        $('tbody tr:eq(0) td').text()
      ];
    });

    expect(data).toEqual([
      'étêter',
      'ethnie',
      'étirer',
      'étoffe',
      'Ökonomie',
      'Oracle',
      'Schomberg',
      'Schön',
      'Schubert',
      'sève'
    ]);
  });

  // HTML mixed with utf8 characters
  // https://datatables.net/forums/discussion/80277/
  await loadTestPage(page, 'empty');

  await test.step('Type detection', async () => {
    await page.evaluate(() => {
      window.table = $('#example').empty().DataTable({
        columns: [
          {
            title: 'Test',
            data: 0
          }
        ],
        data: [
          ['Été <i class="icon icon-wave"></i>'],
          ['sève <i class="icon icon-wave"></i>'],
          ['À propos <i class="icon icon-wave"></i>'],
          ['Schomberg <i class="icon icon-wave"></i>'],
          ['Ökonomie <i class="icon icon-wave"></i>'],
          ['étêter <i class="icon icon-wave"></i>'],
          ['Oracle <i class="icon icon-wave"></i>'],
          ['étirer <i class="icon icon-wave"></i>'],
          ['Été <i class="icon icon-wave"></i>'],
          ['Schön <i class="icon icon-wave"></i>'],
          ['ethnie <i class="icon icon-wave"></i>'],
          ['étoffe <i class="icon icon-wave"></i>'],
          ['Schubert <i class="icon icon-wave"></i>'],
        ]
      });
    });

    const actual = await page.evaluate(() => window.table.column(0).type());
    expect(actual).toBe('html-utf8');
  });

  await test.step('Ordering is as expected', async () => {
    const data = await page.evaluate(() => {
      return [
        $('tbody tr:eq(0) td').text().trim(),
        $('tbody tr:eq(1) td').text().trim(),
        $('tbody tr:eq(2) td').text().trim(),
        $('tbody tr:eq(3) td').text().trim(),
        $('tbody tr:eq(4) td').text().trim(),
        $('tbody tr:eq(5) td').text().trim(),
        $('tbody tr:eq(6) td').text().trim(),
        $('tbody tr:eq(7) td').text().trim(),
        $('tbody tr:eq(8) td').text().trim(),
        $('tbody tr:eq(9) td').text().trim()
      ];
    });

    expect(data).toEqual([
      'À propos',
      'Été',
      'Été',
      'étêter',
      'ethnie',
      'étirer',
      'étoffe',
      'Ökonomie',
      'Oracle',
      'Schomberg'
    ]);
  });

  await test.step('Ordering can be reversed', async () => {
    await clickHeader(page, 0);

    const data = await page.evaluate(() => {
      return [
        $('tbody tr:eq(9) td').text().trim(),
        $('tbody tr:eq(8) td').text().trim(),
        $('tbody tr:eq(7) td').text().trim(),
        $('tbody tr:eq(6) td').text().trim(),
        $('tbody tr:eq(5) td').text().trim(),
        $('tbody tr:eq(4) td').text().trim(),
        $('tbody tr:eq(3) td').text().trim(),
        $('tbody tr:eq(2) td').text().trim(),
        $('tbody tr:eq(1) td').text().trim(),
        $('tbody tr:eq(0) td').text().trim()
      ];
    });

    expect(data).toEqual([
      'étêter',
      'ethnie',
      'étirer',
      'étoffe',
      'Ökonomie',
      'Oracle',
      'Schomberg',
      'Schön',
      'Schubert',
      'sève'
    ]);
  });

  await loadTestPage(page, 'empty');

  await test.step('Load with null data', async () => {
    await page.evaluate(() => {
      const shareHolders = [
        {"name":"ABC Company","surname":"Müller"},
        {"name":"Mark Müller","surname":null}
      ];

      window.table = $('#example').empty().DataTable({
        data: shareHolders,
        columns: [
          {
            data: "name",
            title: "Full Name"
          },
          {
            data: "surname",
            title: "Surname"
          }
        ]
      });
    });

    const actual = await page.evaluate(() => $('tbody tr:eq(0) td:eq(0)').text());
    expect(actual).toBe('ABC Company');
  });

  await test.step('Can order on second column', async () => {
    await clickHeader(page, 1);

    const actual = await page.evaluate(() => $('tbody tr:eq(0) td:eq(0)').text());
    expect(actual).toBe('Mark Müller');
  });
});
