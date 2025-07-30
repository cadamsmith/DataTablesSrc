import { _fnReDraw, _fnDraw } from "../core/core.draw";
import { _fnSort } from "../core/core.sort";

export function _registerApis_draw(register) {
  /**
   * Redraw the tables in the current context.
   */
  register("draw()", function (paging) {
    return this.iterator("table", function (settings) {
      if (paging === "page") {
        _fnDraw(settings);
      } else {
        if (typeof paging === "string") {
          paging = paging === "full-hold" ? false : true;
        }

        _fnReDraw(settings, paging === false, undefined, _fnSort);
      }
    });
  });
}
