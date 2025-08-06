import { test, expect } from '@playwright/test';
import { loadTestPage } from '../../helpers';

test('Right to left layout', async ({ page }) => {
  await loadTestPage(page, 'basic');

  await test.step('Scrollbar position ltr - scroll header padding on right', async () => {
    await page.evaluate(() => {
      window.table = $('#example').DataTable( {
        scrollY: 200,
        paging: false
      } );
    });

    const [paddingLeft, paddingRight] = await page.evaluate(() => {
      const header = $('div.dt-scroll-headInner');
      return [
        parseInt( header.css('paddingLeft'), 10 ),
        parseInt( header.css('paddingRight'), 10 )
      ];
    });

    expect( paddingLeft === paddingRight || paddingLeft < paddingRight ).toBe( true );
  });

  await loadTestPage(page, 'basic');

  await test.step('Scrollbar position rtl - scroll header padding on left', async () => {
    await page.evaluate(() => {
      $('body').css( 'direction', 'rtl' );
      window.table = $('#example').DataTable( {
        scrollY: 200,
        paging: false
      } );
    });

    const [paddingLeft, paddingRight] = await page.evaluate(() => {
      const header = $('div.dt-scroll-headInner');
      return [
        parseInt( header.css('paddingLeft'), 10 ),
        parseInt( header.css('paddingRight'), 10 )
      ];
    });

    expect( paddingLeft === paddingRight || paddingLeft > paddingRight ).toBe( true );
  });

  await loadTestPage(page, 'basic');

  await test.step('Scroll left does not alter the scrollbar position detection (ltr)', async () => {
    await page.evaluate(() => {
      $('body').css( 'direction', 'ltr' );
      window.force = $('<div style="width:2000px; height: 2px;"/>').appendTo('body');
      $('body').scrollLeft(50);

      window.table = $('#example').DataTable( {
        scrollY: 200,
        paging: false
      } );
    });

    const [paddingLeft, paddingRight] = await page.evaluate(() => {
      const header = $('div.dt-scroll-headInner');
      return [
        parseInt( header.css('paddingLeft'), 10 ),
        parseInt( header.css('paddingRight'), 10 )
      ];
    });

    expect( paddingLeft === paddingRight || paddingLeft < paddingRight).toBe( true );

    await page.evaluate(() => {
      window.force.remove();
    });
  });

  await test.step('Scroll left does not alter the scrollbar position detection (rtl)', async () => {
    await page.evaluate(() => {
      $('body').css( 'direction', 'rtl' );
      window.force = $('<div style="width:2000px; height: 2px;"/>').appendTo('body');
      $('body').scrollLeft(50);

      window.table = $('#example').DataTable( {
        scrollY: 200,
        paging: false
      } );
    });

    const [paddingLeft, paddingRight] = await page.evaluate(() => {
      const header = $('div.dt-scroll-headInner');
      return [
        parseInt( header.css('paddingLeft'), 10 ),
        parseInt( header.css('paddingRight'), 10 )
      ];
    });

    expect( paddingLeft === paddingRight || paddingLeft > paddingRight ).toBe( true );

    await page.evaluate(() => {
      $('body').css( 'direction', 'ltr' );
      window.force.remove();
    });
  });
});
