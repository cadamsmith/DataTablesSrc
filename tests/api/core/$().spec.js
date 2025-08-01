import { test, expect } from '@playwright/test';
import { loadTestContent, getBaseUrl } from '../../helpers';

test.describe('core - $()', () => {
  test.beforeEach(async ({ page }) => {
    // Load the base template
    await page.goto(getBaseUrl());
    // Load and inject the "basic" table
    const body = loadTestContent('basic.html');
    await page.evaluate((html) => {
      document.getElementById('dt-test-loader-container').innerHTML = html;
    }, body);
    // Initialize DataTable
    await page.evaluate(() => {
      window.table = $('#example').DataTable();
    });
  });

  test('Exists and is a function', async ({ page }) => {
    const type = await page.evaluate(() => typeof window.table.$);
    expect(type).toBe('function');
  });

  test('Returns a jQuery instance', async ({ page }) => {
    const isJQuery = await page.evaluate(
      () => window.table.$('tr') instanceof window.jQuery
    );
    expect(isJQuery).toBe(true);
  });

  test('Selector - node', async ({ page }) => {
    const text = await page.evaluate(() =>
      window.table.$(window.table.cell(2, 0).node()).text()
    );
    expect(text).toBe('Ashton Cox');
  });

  test('Selector - jQuery', async ({ page }) => {
    const text = await page.evaluate(() =>
      window.table.$($('tbody tr:eq(2) td:eq(0)')).text()
    );
    expect(text).toBe('Ashton Cox');
  });

  test('Selector - string', async ({ page }) => {
    const text = await page.evaluate(() =>
      window.table.$('td:contains("Cox")').text()
    );
    expect(text).toBe('Ashton Cox');
  });

  test('Modifier - none', async ({ page }) => {
    const len = await page.evaluate(() => window.table.$('tr').length);
    expect(len).toBe(57);
  });

  test('Modifier - page', async ({ page }) => {
    const len = await page.evaluate(
      () => window.table.$('tr', { page: 'current' }).length
    );
    expect(len).toBe(10);
  });

  test('Modifier - order - original', async ({ page }) => {
    const firstWord = await page.evaluate(
      () =>
        window.table
          .$('tr:eq(0)', { order: 'original' })
          .text()
          .trim()
          .split(' ')[0]
    );
    expect(firstWord).toBe('Tiger');
  });

  test('Modifier - order - current', async ({ page }) => {
    const firstWord = await page.evaluate(
      () =>
        window.table
          .$('tr:eq(0)', { order: 'current' })
          .text()
          .trim()
          .split(' ')[0]
    );
    expect(firstWord).toBe('Airi');
  });
});
