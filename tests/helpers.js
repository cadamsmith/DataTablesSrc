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
