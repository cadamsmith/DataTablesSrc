import { _extend } from '../core/core.jq';
import { _fnImplementState, _fnSaveState } from '../core/core.state';

/*
 * State API methods
 */
export function _registerApis_state(register) {
  register('state()', function (set, ignoreTime) {
    // getter
    if (!set) {
      return this.context.length ? this.context[0].oSavedState : null;
    }

    var setMutate = _extend(true, {}, set);

    // setter
    return this.iterator('table', function (settings) {
      if (ignoreTime !== false) {
        setMutate.time = +new Date() + 100;
      }

      _fnImplementState(settings, setMutate, function () {});
    });
  });

  register('state.clear()', function () {
    return this.iterator('table', function (settings) {
      // Save an empty object
      settings.fnStateSaveCallback.call(settings.oInstance, settings, {});
    });
  });

  register('state.loaded()', function () {
    return this.context.length ? this.context[0].oLoadedState : null;
  });

  register('state.save()', function () {
    return this.iterator('table', function (settings) {
      _fnSaveState(settings);
    });
  });
}
