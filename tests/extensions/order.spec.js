import { test, expect } from '@playwright/test';
import { clickHeader, loadTestPage } from '../helpers';

test('nonjQuery - ajax', async ({ page }) => {
  await loadTestPage(page, 'basic');

  await test.step('Define a custom sorter with a pre-formatter', async () => {
    await page.evaluate(() => {
      window.counter = 0;

      DataTable.ext.type.order['test1-pre'] = function (d) {
        counter++;
        window.args = arguments;

        if (d === 'Cedric Kelly') {
          return -1;
        }
        return 0;
      };

      new DataTable('#example', {
        columnDefs: [
          {
            target: 0,
            type: 'test1',
          },
        ],
      });
    });

    const actual = await page.evaluate(() =>
      $('#example tbody td').eq(0).text()
    );
    expect(actual).toBe('Cedric Kelly');
  });

  await test.step('Pre-formatter was called once for each cell', async () => {
    const actual = await page.evaluate(() => window.counter);
    expect(actual).toBe(57);
  });

  await test.step('A two parameters were passed to the pre function', async () => {
    const actual = await page.evaluate(() => window.args.length);
    expect(actual).toBe(2);
  });

  await test.step('Second is the settings object', async () => {
    const actual = await page.evaluate(() => window.args[1].nTable);
    expect(actual).toBeDefined();
  });

  await loadTestPage(page, 'basic');

  await test.step('Custom asc and desc formatters', async () => {
    await page.evaluate(() => {
      window.counterAsc = 0;
      window.counterDesc = 0;

      DataTable.ext.type.order['test2-asc'] = function (a, b) {
        counterAsc++;
        window.argsAsc = arguments;
        return a.localeCompare(b);
      };

      DataTable.ext.type.order['test2-desc'] = function (a, b) {
        counterDesc++;
        window.argsDesc = arguments;
        return b.localeCompare(a);
      };

      new DataTable('#example', {
        columnDefs: [
          {
            target: 0,
            type: 'test2',
          },
        ],
      });
    });

    const actual = await page.evaluate(() =>
      $('#example tbody td').eq(0).text()
    );
    expect(actual).toBe('Airi Satou');
  });

  await test.step('Functions were called as needed', async () => {
    // The sorting algorithm defines how many times it will actually be called
    const [counterAsc, counterDesc] = await page.evaluate(() => [
      window.counterAsc,
      window.counterDesc,
    ]);

    expect(counterAsc).toBeGreaterThan(0);
    expect(counterDesc).toBe(0);
  });

  await test.step('Two arguments were given to the sort function', async () => {
    // The sorting algorithm defines how many times it will actually be called
    const actual = await page.evaluate(() => window.argsAsc.length);
    expect(actual).toBe(2);
  });

  await test.step('Reverse sorting', async () => {
    await page.evaluate(() => {
      window.counter = window.counterAsc;
    });

    await clickHeader(page, 0);

    const actual = await page.evaluate(() => $('#example tbody td').eq(0).text());
    expect(actual).toBe('Zorita Serrano');
  });

  await test.step('Functions were called as needed', async () => {
    const [counter, counterAsc, counterDesc] = await page.evaluate(() => [
      window.counter,
      window.counterAsc,
      window.counterDesc,
    ]);

    expect(counterDesc).toBeGreaterThan(0);
    expect(counter).toBe(counterAsc);
  });

  await test.step('Two arguments were given to the sort function', async () => {
    // The sorting algorithm defines how many times it will actually be called
    const actual = await page.evaluate(() => window.argsDesc.length);
    expect(actual).toBe(2);
  });

  await loadTestPage(page, 'basic');

  await test.step('Pre, asc and desc can all be defined', async () => {
    await page.evaluate(() => {
      window.counter = 0;
      window.counterAsc = 0;
      window.counterDesc = 0;

      DataTable.ext.type.order['test3-pre'] = function (d) {
        window.counter++;
        return d.toLowerCase();
      }

      DataTable.ext.type.order['test3-asc'] = function (a, b) {
        window.counterAsc++;
        return a.localeCompare(b);
      }

      DataTable.ext.type.order['test3-desc'] = function (a, b) {
        window.counterDesc++;
        return b.localeCompare(a);
      }

      new DataTable('#example', {
        columnDefs: [{
          target: 0,
          type: 'test3'
        }]
      });
    });

    const actual = await page.evaluate(() => $('#example tbody td').eq(0).text());
    expect(actual).toBe('Airi Satou');
  });

  await test.step('Functions were called', async () => {
    const [counter, counterAsc, counterDesc] = await page.evaluate(() => [
      window.counter,
      window.counterAsc,
      window.counterDesc,
    ]);

    expect(counter).toBe(57);
    expect(counterAsc).toBeGreaterThan(0);
    expect(counterDesc).toBe(0);
  });
});
