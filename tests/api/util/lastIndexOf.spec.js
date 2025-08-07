import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test.describe('lastIndexOf()', () => {
  test('Check the defaults', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await test.step('Exists and is a function', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
      const type = await page.evaluate(() => typeof window.table.lastIndexOf);
      expect(type).toBe('function');
    });
    await test.step('Returns an integer', async () => {
      const val = await page.evaluate(() => typeof window.table.lastIndexOf());
      expect(val).toBe('number');
    });
  });

  test('Functional tests', async ({ page }) => {
    await loadTestPage(page, 'basic');
    await test.step('Check on unique column results', async () => {
      await page.evaluate(() => {
        window.table = $('#example').DataTable();
      });
      const result = await page.evaluate(() => {
        const data = $('#example').DataTable().column(2).data().unique();
        return {
          tokyo: data.lastIndexOf('Tokyo'),
          newYork: data.lastIndexOf('New York'),
          singapore: data.lastIndexOf('Singapore'),
          notThere: data.lastIndexOf('Not There')
        };
      });
      expect(result.tokyo).toBe(0);
      expect(result.newYork).toBe(3);
      expect(result.singapore).toBe(6);
      expect(result.notThere).toBe(-1);
    });
    await test.step('Check on column results', async () => {
      const result = await page.evaluate(() => {
        const data = $('#example').DataTable().column(2).data();
        return {
          tokyo: data.lastIndexOf('Tokyo'),
          newYork: data.lastIndexOf('New York'),
          singapore: data.lastIndexOf('Singapore'),
          notThere: data.lastIndexOf('Not There')
        };
      });
      expect(result.tokyo).toBe(45);
      expect(result.newYork).toBe(55);
      expect(result.singapore).toBe(43);
      expect(result.notThere).toBe(-1);
    });
    await test.step('Check on row data', async () => {
      const result = await page.evaluate(() => {
        const data = $('#example').DataTable().row(2).data();
        return {
          ashton: data.lastIndexOf('Ashton Cox'),
          sixtySix: data.lastIndexOf('66'),
          date: data.lastIndexOf('2009/01/12')
        };
      });
      expect(result.ashton).toBe(0);
      expect(result.sixtySix).toBe(3);
      expect(result.date).toBe(4);
    });
    await test.step('Check not there', async () => {
      const result = await page.evaluate(() => {
        const data = $('#example').DataTable().row(2).data();
        return {
          ashton: data.lastIndexOf('Ashton'),
          cox: data.lastIndexOf('Cox'),
          ashtonCox: data.lastIndexOf('Ashton  Cox'),
          ashtonCoxs: data.lastIndexOf('Ashton Coxs'),
          empty: data.lastIndexOf('')
        };
      });
      expect(result.ashton).toBe(-1);
      expect(result.cox).toBe(-1);
      expect(result.ashtonCox).toBe(-1);
      expect(result.ashtonCoxs).toBe(-1);
      expect(result.empty).toBe(-1);
    });
  });
});
