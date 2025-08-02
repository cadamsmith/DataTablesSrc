import { expect, test } from '@playwright/test';
import { loadTestPage } from '../../helpers.js';

test.describe('core - ajax', () => {
  test.beforeEach(async ({ page }) => {
    await loadTestPage(page, 'basic');
  });

  test('Ensure namespace object exists on the API instance', async ({
    page,
  }) => {
      const type = await page.evaluate(() => {
        const table = $('#example').DataTable();
        return typeof table.ajax;
      });

    expect(type).toBe('object');
  });
});
