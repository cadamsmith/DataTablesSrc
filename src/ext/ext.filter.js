import { _empty, _re_new_lines } from "../core/core.internal";
import { _dt_util } from "../api/api.util";

// Common function to remove new lines, strip HTML and diacritic control
export var _filterString = function (stripHtml, normalize) {
  return function (str) {
    if (_empty(str) || typeof str !== "string") {
      return str;
    }

    str = str.replace(_re_new_lines, " ");

    if (stripHtml) {
      str = _dt_util._stripHtml(str);
    }

    if (normalize) {
      str = _dt_util._normalize(str, false);
    }

    return str;
  };
};
