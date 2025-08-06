import { test, expect } from '@playwright/test';
import { clickHeader, loadTestPage } from '../../helpers';

test('Complex header ordering', async ({ page }) => {
  await loadTestPage(page, 'complex-header-footer');

  await test.step('Load DataTable', async () => {
    await page.evaluate(() => {
      window.table = $('#example').DataTable();

      window.firstRow = $('thead tr:first-child th');
    });

    let actual = await page.evaluate(() => window.firstRow.eq(0).hasClass('dt-ordering-asc'));
    expect(actual).toBe(true);

    actual = await page.evaluate(() => window.firstRow.eq(0).hasClass('dt-ordering-desc'));
    expect(actual).toBe(false);

    actual = await page.evaluate(() => window.firstRow.eq(1).hasClass('dt-ordering-asc'));
    expect(actual).toBe(false);

    actual = await page.evaluate(() => window.firstRow.eq(1).hasClass('dt-ordering-desc'));
    expect(actual).toBe(false);

    actual = await page.evaluate(() => window.firstRow.eq(2).hasClass('dt-ordering-asc'));
    expect(actual).toBe(false);

    actual = await page.evaluate(() => window.firstRow.eq(2).hasClass('dt-ordering-desc'));
    expect(actual).toBe(false);

    actual = await page.evaluate(() => $('tbody td').eq(0).text());
    expect(actual).toBe('Airi Satou');
  });

  await test.step('Sort on Contact column', async () => {
    await clickHeader(page, '#example thead tr:first-child th', 2);

    await page.evaluate(() => {
      window.firstRow = $('thead tr:first-child th');
    });

    let actual = await page.evaluate(() => window.firstRow.eq(0).hasClass('dt-ordering-asc'));
    expect(actual).toBe(false);

    actual = await page.evaluate(() => window.firstRow.eq(0).hasClass('dt-ordering-desc'));
    expect(actual).toBe(false);

    actual = await page.evaluate(() => window.firstRow.eq(1).hasClass('dt-ordering-asc'));
    expect(actual).toBe(false);

    actual = await page.evaluate(() => window.firstRow.eq(1).hasClass('dt-ordering-desc'));
    expect(actual).toBe(false);

    actual = await page.evaluate(() => window.firstRow.eq(2).hasClass('dt-ordering-asc'));
    expect(actual).toBe(true);

    actual = await page.evaluate(() => window.firstRow.eq(2).hasClass('dt-ordering-desc'));
    expect(actual).toBe(false);

    actual = await page.evaluate(() => $('tbody td').eq(0).text());
    expect(actual).toBe('Tatyana Fitzpatrick');
  });

  await test.step('Reverse sort on Contact column', async () => {
    await clickHeader(page, '#example thead tr:first-child th', 2);

    await page.evaluate(() => {
      window.firstRow = $('thead tr:first-child th');
    });

    let actual = await page.evaluate(() => window.firstRow.eq(0).hasClass('dt-ordering-asc'));
    expect(actual).toBe(false);

    actual = await page.evaluate(() => window.firstRow.eq(0).hasClass('dt-ordering-desc'));
    expect(actual).toBe(false);

    actual = await page.evaluate(() => window.firstRow.eq(1).hasClass('dt-ordering-asc'));
    expect(actual).toBe(false);

    actual = await page.evaluate(() => window.firstRow.eq(1).hasClass('dt-ordering-desc'));
    expect(actual).toBe(false);

    actual = await page.evaluate(() => window.firstRow.eq(2).hasClass('dt-ordering-asc'));
    expect(actual).toBe(false);

    actual = await page.evaluate(() => window.firstRow.eq(2).hasClass('dt-ordering-desc'));
    expect(actual).toBe(true);

    actual = await page.evaluate(() => $('tbody td').eq(0).text());
    expect(actual).toBe('Michael Silva');
  });

  await test.step('Null sort on Contact column', async () => {
    await clickHeader(page, '#example thead tr:first-child th', 2);

    await page.evaluate(() => {
      window.firstRow = $('thead tr:first-child th');
    });

    let actual = await page.evaluate(() => window.firstRow.eq(0).hasClass('dt-ordering-asc'));
    expect(actual).toBe(false);

    actual = await page.evaluate(() => window.firstRow.eq(0).hasClass('dt-ordering-desc'));
    expect(actual).toBe(false);

    actual = await page.evaluate(() => window.firstRow.eq(1).hasClass('dt-ordering-asc'));
    expect(actual).toBe(false);

    actual = await page.evaluate(() => window.firstRow.eq(1).hasClass('dt-ordering-desc'));
    expect(actual).toBe(false);

    actual = await page.evaluate(() => window.firstRow.eq(2).hasClass('dt-ordering-asc'));
    expect(actual).toBe(false);

    actual = await page.evaluate(() => window.firstRow.eq(2).hasClass('dt-ordering-desc'));
    expect(actual).toBe(false);

    actual = await page.evaluate(() => $('tbody td').eq(0).text());
    expect(actual).toBe('Tiger Nixon');
  });

  await loadTestPage(page, 'basic');

  await test.step('Initialisation with single row complex header', async () => {
    await page.evaluate(() => {
      $('#example thead tr th').last().remove();
      $('#example thead tr th').last()[0].colSpan = 2;

      window.table = $('#example').DataTable();
    });

    const actual = await page.evaluate(() => $('tbody td').eq(0).text());
    expect(actual).toBe('Airi Satou');
  });
});
