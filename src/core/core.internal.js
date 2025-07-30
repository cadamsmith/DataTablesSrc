import { _dt_util_replaceable } from "../api/api.util.replaceable";

var _re_dic = {};

export var _re_new_lines = /[\r\n\u2028]/g;

// Private variable that is used to match action syntax in the data property object
export var __reArray = /\[.*?\]$/;

export var __reFn = /\(\)$/;

// This is not strict ISO8601 - Date.parse() is quite lax, although
// implementations differ between browsers.
export var _re_date =
  /^\d{2,4}[./-]\d{1,2}[./-]\d{1,2}([T ]{1}\d{1,2}[:.]\d{2}([.:]\d{2})?)?$/;

// https://en.wikipedia.org/wiki/Foreign_exchange_market
// - \u20BD - Russian ruble.
// - \u20a9 - South Korean Won
// - \u20BA - Turkish Lira
// - \u20B9 - Indian Rupee
// - R - Brazil (R$) and South Africa
// - fr - Swiss Franc
// - kr - Swedish krona, Norwegian krone and Danish krone
// - \u2009 is thin space and \u202F is narrow no-break space, both used in many
// - Ƀ - Bitcoin
// - Ξ - Ethereum
//   standards as thousands separators.
export var _re_formatted_numeric =
  /['\u00A0,$£€¥%\u2009\u202F\u20BD\u20a9\u20BArfkɃΞ]/gi;

// Escape regular expression special characters
export var _re_escape_regex = new RegExp(
  "(\\" +
    [
      "/",
      ".",
      "*",
      "+",
      "?",
      "|",
      "(",
      ")",
      "[",
      "]",
      "{",
      "}",
      "\\",
      "$",
      "^",
      "-",
    ].join("|\\") +
    ")",
  "g"
);

export var _empty = function (d) {
  return !d || d === true || d === "-" ? true : false;
};

// Convert from a formatted number with characters other than `.` as the
// decimal place, to a Javascript number
export var _numToDecimal = function (num, decimalPoint) {
  // Cache created regular expressions for speed as this function is called often
  if (!_re_dic[decimalPoint]) {
    _re_dic[decimalPoint] = new RegExp(_escapeRegex(decimalPoint), "g");
  }
  return typeof num === "string" && decimalPoint !== "."
    ? num.replace(/\./g, "").replace(_re_dic[decimalPoint], ".")
    : num;
};

/**
 * Find the unique elements in a source array.
 *
 * @param  {array} src Source array
 * @return {array} Array of unique items
 * @ignore
 */
export var _unique = function (src) {
  if (Array.from && Set) {
    return Array.from(new Set(src));
  }

  if (_areAllUnique(src)) {
    return src.slice();
  }

  // A faster unique method is to use object keys to identify used values,
  // but this doesn't work with arrays or objects, which we must also
  // consider. See jsperf.app/compare-array-unique-versions/4 for more
  // information.
  var out = [],
    val,
    i,
    ien = src.length,
    j,
    k = 0;

  again: for (i = 0; i < ien; i++) {
    val = src[i];

    for (j = 0; j < k; j++) {
      if (out[j] === val) {
        continue again;
      }
    }

    out.push(val);
    k++;
  }

  return out;
};

/**
 * Determine if all values in the array are unique. This means we can short
 * cut the _unique method at the cost of a single loop. A sorted array is used
 * to easily check the values.
 *
 * @param  {array} src Source array
 * @return {boolean} true if all unique, false otherwise
 * @ignore
 */
var _areAllUnique = function (src) {
  if (src.length < 2) {
    return true;
  }

  var sorted = src.slice().sort();
  var last = sorted[0];

  for (var i = 1, ien = sorted.length; i < ien; i++) {
    if (sorted[i] === last) {
      return false;
    }

    last = sorted[i];
  }

  return true;
};

export var _intVal = function (s) {
  var integer = parseInt(s, 10);
  return !isNaN(integer) && isFinite(s) ? integer : null;
};

export var _isNumber = function (d, decimalPoint, formatted, allowEmpty) {
  var type = typeof d;
  var strType = type === "string";

  if (type === "number" || type === "bigint") {
    return true;
  }

  // If empty return immediately so there must be a number if it is a
  // formatted string (this stops the string "k", or "kr", etc being detected
  // as a formatted number for currency
  if (allowEmpty && _empty(d)) {
    return true;
  }

  if (decimalPoint && strType) {
    d = _numToDecimal(d, decimalPoint);
  }

  if (formatted && strType) {
    d = d.replace(_re_formatted_numeric, "");
  }

  return !isNaN(parseFloat(d)) && isFinite(d);
};

// A string without HTML in it can be considered to be HTML still
var _isHtml = function (d) {
  return _empty(d) || typeof d === "string";
};

// Is a string a number surrounded by HTML?
export var _htmlNumeric = function (d, decimalPoint, formatted, allowEmpty) {
  if (allowEmpty && _empty(d)) {
    return true;
  }

  // input and select strings mean that this isn't just a number
  if (typeof d === "string" && d.match(/<(input|select)/i)) {
    return null;
  }

  var html = _isHtml(d);
  return !html
    ? null
    : _isNumber(_dt_util_replaceable.stripHtml(d), decimalPoint, formatted, allowEmpty)
      ? true
      : null;
};

export var _pluck = function (a, prop, prop2) {
  var out = [];
  var i = 0,
    ien = a.length;

  // Could have the test in the loop for slightly smaller code, but speed
  // is essential here
  if (prop2 !== undefined) {
    for (; i < ien; i++) {
      if (a[i] && a[i][prop]) {
        out.push(a[i][prop][prop2]);
      }
    }
  } else {
    for (; i < ien; i++) {
      if (a[i]) {
        out.push(a[i][prop]);
      }
    }
  }

  return out;
};

// Basically the same as _pluck, but rather than looping over `a` we use `order`
// as the indexes to pick from `a`
export var _pluck_order = function (a, order, prop, prop2) {
  var out = [];
  var i = 0,
    ien = order.length;

  // Could have the test in the loop for slightly smaller code, but speed
  // is essential here
  if (prop2 !== undefined) {
    for (; i < ien; i++) {
      if (a[order[i]] && a[order[i]][prop]) {
        out.push(a[order[i]][prop][prop2]);
      }
    }
  } else {
    for (; i < ien; i++) {
      if (a[order[i]]) {
        out.push(a[order[i]][prop]);
      }
    }
  }

  return out;
};

export var _range = function (len, start) {
  var out = [];
  var end;

  if (start === undefined) {
    start = 0;
    end = len;
  } else {
    end = start;
    start = len;
  }

  for (var i = start; i < end; i++) {
    out.push(i);
  }

  return out;
};

export var _removeEmpty = function (a) {
  var out = [];

  for (var i = 0, ien = a.length; i < ien; i++) {
    if (a[i]) {
      // careful - will remove all falsy values!
      out.push(a[i]);
    }
  }

  return out;
};

// Surprisingly this is faster than [].concat.apply
// https://jsperf.com/flatten-an-array-loop-vs-reduce/2
export var _flatten = function (out, val) {
  if (Array.isArray(val)) {
    for (var i = 0; i < val.length; i++) {
      _flatten(out, val[i]);
    }
  } else {
    out.push(val);
  }

  return out;
};

// Similar to jQuery's addClass, but use classList.add
export function _addClass(el, name) {
  if (name) {
    name.split(" ").forEach(function (n) {
      if (n) {
        // `add` does deduplication, so no need to check `contains`
        el.classList.add(n);
      }
    });
  }
}

export function _escapeRegex(val) {
  return val.replace(_re_escape_regex, "\\$1");
}

/**
 * Split string on periods, taking into account escaped periods
 * @param  {string} str String to split
 * @return {array} Split string
 */
export function _splitObjNotation(str) {
  var parts = str.match(/(\\.|[^.])+/g) || [""];

  return parts.map(function (s) {
    return s.replace(/\\\./g, ".");
  });
}

/**
 * Append a CSS unit (only if required) to a string
 *  @param {string} value to css-ify
 *  @returns {string} value with css unit
 *  @memberof DataTable#oApi
 */
export function _stringToCss(s) {
  if (s === null) {
    return "0px";
  }

  if (typeof s == "number") {
    return s < 0 ? "0px" : s + "px";
  }

  // Check it has a unit character already
  return s.match(/\d$/) ? s + "px" : s;
}
