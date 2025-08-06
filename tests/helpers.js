import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Helper to load and inject the basic table
export async function loadTestPage(page, name) {
  await page.goto(getBaseUrl());
  const body = loadTestContent(`${name}.html`);
  await page.evaluate((html) => {
    document.getElementById('dt-test-loader-container').innerHTML = html;
  }, body);
}

function loadTestContent(name) {
  // Loads the content to be inserted (e.g. just the table HTML)
  const filePath = resolve(__dirname, 'html', name);
  return readFileSync(filePath, 'utf8');
}

function getBaseUrl() {
  // Use the Playwright baseURL
  return 'http://localhost:8080/tests/html/test_container.html';
}

// In tests/helpers.js

/**
 * Clicks a DataTable header cell, supporting shift-click.
 * @param {import('@playwright/test').Page} page
 * @param {string|number} selectorOrColumn - Selector string or column index
 * @param {number|object} [columnOrOptions] - Column index or options
 * @param {object} [options] - Options (e.g. { shift: true })
 */
export async function clickHeader(page, selectorOrColumn, columnOrOptions, options) {
  let selector, column;
  // Argument shifting logic
  if (typeof selectorOrColumn === 'number') {
    column = selectorOrColumn;
    options = columnOrOptions;
    selector = '#example thead th';
  } else {
    selector = selectorOrColumn;
    column = columnOrOptions;
  }
  // Build the selector for the Nth header cell
  const thSelector = `${selector}:nth-child(${column + 1})`;
  if (options && options.shift) {
    await page.click(thSelector, { modifiers: ['Shift'] });
  } else {
    await page.click(thSelector);
  }
  // Mimic the original delay
  await page.waitForTimeout(25);
}
