import { test, expect } from '@playwright/test';
import { loadTestPage } from '../helpers';

test('number rendering helper', async ({ page }) => {
  await loadTestPage(page, 'basic');

  await test.step('Number renderer exists', async () => {
    await page.evaluate(() => {
      window.numberRenderer = $.fn.dataTable.render.number;
    });

    const type = await page.evaluate(() => typeof window.numberRenderer);
    expect(type).toBe('function');
  });

  await test.step('Number renderer returns an object with a display property', async () => {
    const actual = await page.evaluate(() => typeof window.numberRenderer().display);
    expect(actual).toBe('function');
  });

  await test.step('Simple use case - 1 (thousands - comma)', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 0).display(1));
    expect(actual).toBe('1');
  });

  await test.step('Simple use case - 10 (thousands - comma)', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 0).display(10));
    expect(actual).toBe('10');
  });

  await test.step('Simple use case - 100 (thousands - comma)', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 0).display(100));
    expect(actual).toBe('100');
  });

  await test.step('Simple use case - 1000 (thousands - comma)', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 0).display(1000));
    expect(actual).toBe('1,000');
  });

  await test.step('Simple use case - 10000 (thousands - comma)', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 0).display(10000));
    expect(actual).toBe('10,000');
  });

  await test.step('Simple use case - 100000 (thousands - comma)', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 0).display(100000));
    expect(actual).toBe('100,000');
  });

  await test.step('Simple use case - 1000000 (thousands - comma)', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 0).display(1000000));
    expect(actual).toBe('1,000,000');
  });

  await test.step('Simple use case - 10000000 (thousands - comma)', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 0).display(10000000));
    expect(actual).toBe('10,000,000');
  });

  await test.step('Simple use case - 1 (thousands - apos)', async () => {
    const actual = await page.evaluate(() => window.numberRenderer("'", '.', 0).display(1));
    expect(actual).toBe('1');
  });

  await test.step('Simple use case - 10 (thousands - apos)', async () => {
    const actual = await page.evaluate(() => window.numberRenderer("'", '.', 0).display(10));
    expect(actual).toBe('10');
  });

  await test.step('Simple use case - 100 (thousands - apos)', async () => {
    const actual = await page.evaluate(() => window.numberRenderer("'", '.', 0).display(100));
    expect(actual).toBe('100');
  });

  await test.step('Simple use case - 1000 (thousands - apos)', async () => {
    const actual = await page.evaluate(() => window.numberRenderer("'", '.', 0).display(1000));
    expect(actual).toBe("1'000");
  });

  await test.step('Simple use case - 10000 (thousands - apos)', async () => {
    const actual = await page.evaluate(() => window.numberRenderer("'", '.', 0).display(10000));
    expect(actual).toBe("10'000");
  });

  await test.step('Simple use case - 100000 (thousands - apos)', async () => {
    const actual = await page.evaluate(() => window.numberRenderer("'", '.', 0).display(100000));
    expect(actual).toBe("100'000");
  });

  await test.step('Simple use case - 1000000 (thousands - apos)', async () => {
    const actual = await page.evaluate(() => window.numberRenderer("'", '.', 0).display(1000000));
    expect(actual).toBe("1'000'000");
  });

  await test.step('Simple use case - 10000000 (thousands - apos)', async () => {
    const actual = await page.evaluate(() => window.numberRenderer("'", '.', 0).display(10000000));
    expect(actual).toBe("10'000'000");
  });

  await test.step('Simple use case - 1 (decimal)', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 0).display(1));
    expect(actual).toBe('1');
  });

  await test.step('Simple use case - 0.5 (decimal - float)', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 1).display(0.5));
    expect(actual).toBe('0.5');
  });

  await test.step('Simple use case - 1000.5 (decimal - float)', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 1).display(1000.5));
    expect(actual).toBe('1,000.5');
  });

  await test.step('Simple use case - 1000 (decimal - no thous)', async () => {
    const actual = await page.evaluate(() => window.numberRenderer('', ',', 1).display(1000));
    expect(actual).toBe('1000,0');
  });

  await test.step('Simple use case - 1000 (decimal - euro)', async () => {
    const actual = await page.evaluate(() => window.numberRenderer('.', ',', 1).display(1000));
    expect(actual).toBe('1.000,0');
  });

  await test.step('Precision - 0 dp - round down', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 0).display(3.141592));
    expect(actual).toBe('3');
  });

  await test.step('Precision - 0 dp - round up', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 0).display(0.999860600));
    expect(actual).toBe('1');
  });

  await test.step('Precision - 1 dp - round down', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 1).display(3.141592));
    expect(actual).toBe('3.1');
  });

  await test.step('Precision - 1 dp - round up', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 1).display(0.999860600));
    expect(actual).toBe('1.0');
  });

  await test.step('Precision - 2 dp - round down', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 2).display(3.141592));
    expect(actual).toBe('3.14');
  });

  await test.step('Precision - 2 dp - round up', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 2).display(0.999860600));
    expect(actual).toBe('1.00');
  });

  await test.step('Precision - 3 dp - round down', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 3).display(3.141111));
    expect(actual).toBe('3.141');
  });

  await test.step('Precision - 3 dp - round up', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 3).display(0.999860600));
    expect(actual).toBe('1.000');
  });

  await test.step('Precision - 4 dp - round down', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 4).display(3.141111));
    expect(actual).toBe('3.1411');
  });

  await test.step('Precision - 4 dp - round up', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 4).display(0.999860600));
    expect(actual).toBe('0.9999');
  });

  await test.step('Precision - 4 dp - thous', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 4).display(1003.141111));
    expect(actual).toBe('1,003.1411');
  });

  await test.step('Prefix - single char - 1', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 0, '$').display(1));
    expect(actual).toBe('$1');
  });

  await test.step('Prefix - single char - 1050.5', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 1, '$').display(1050.5));
    expect(actual).toBe('$1,050.5');
  });

  await test.step('Prefix - multi char - 1', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 0, 'test').display(1));
    expect(actual).toBe('test1');
  });

  await test.step('Prefix - multi char - 1050.5', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 1, 'bob').display(1050.5));
    expect(actual).toBe('bob1,050.5');
  });

  await test.step('Postfix - single char - 1', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 0, '', 'c').display(1));
    expect(actual).toBe('1c');
  });

  await test.step('Postfix - single char - 1050.5', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 1, '', 'c').display(1050.5));
    expect(actual).toBe('1,050.5c');
  });

  await test.step('Postfix - multi char - 1', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 0, '', 'frank').display(1));
    expect(actual).toBe('1frank');
  });

  await test.step('Postfix - multi char - 1050.5', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 1, '', 'fred').display(1050.5));
    expect(actual).toBe('1,050.5fred');
  });

  await test.step('Prefix and postfix - single char - 1', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 0, '$', 'c').display(1));
    expect(actual).toBe('$1c');
  });

  await test.step('Prefix and postfix - single char - 1050.5', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 1, '$', 'c').display(1050.5));
    expect(actual).toBe('$1,050.5c');
  });

  await test.step('Prefix and postfix - multi char - 1', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 0, 'frances', 'fiona').display(1));
    expect(actual).toBe('frances1fiona');
  });

  await test.step('Prefix and postfix - multi char - 1050.5', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 1, 'fabia', 'fable').display(1050.5));
    expect(actual).toBe('fabia1,050.5fable');
  });

  await test.step('Non-numeric data is not renderer', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 1, 'a', 'b').display('fiona'));
    expect(actual).toBe('fiona');
  });

  await test.step('Non-numeric HTML data is escaped', async () => {
    const actual = await page.evaluate(() => window.numberRenderer(',', '.', 1, 'a', 'b').display('<span>1</span>'));
    expect(actual).toBe('&lt;span&gt;1&lt;/span&gt;');
  });
});
