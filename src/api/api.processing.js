import { _fnProcessingDisplay } from '../core/core.processing';

export function _registerApis_processing(register) {
  register('processing()', function (show) {
    return this.iterator('table', function (ctx) {
      _fnProcessingDisplay(ctx, show);
    });
  });
}
