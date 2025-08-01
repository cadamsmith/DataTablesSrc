import { _fnAdjustColumnSizing } from './core.columns';
import { _fnCallbackFire } from './core.support';

/**
 * Draw the table for the first time, adding all required features
 *  @param {object} settings dataTables settings object
 *  @memberof DataTable#oApi
 */
export function _fnInitComplete(settings) {
  if (settings._bInitComplete) {
    return;
  }

  var args = [settings, settings.json];

  settings._bInitComplete = true;

  // Table is fully set up and we have data, so calculate the
  // column widths
  _fnAdjustColumnSizing(settings);

  _fnCallbackFire(settings, null, 'plugin-init', args, true);
  _fnCallbackFire(settings, 'aoInitComplete', 'init', args, true);
}
