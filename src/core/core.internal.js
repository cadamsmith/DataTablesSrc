import { _fnEscapeRegex } from "./core.filter";
import { _dt_util } from "../api/api.util";

var _re_dic = {};

export var _re_html = /<([^>]*>)/g;

export var _re_new_lines = /[\r\n\u2028]/g;

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
    _re_dic[decimalPoint] = new RegExp(_fnEscapeRegex(decimalPoint), "g");
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
    : _isNumber(_dt_util._stripHtml(d), decimalPoint, formatted, allowEmpty)
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

export function _isPlainObject(obj) {
  var proto, Ctor;

  // Detect obvious negatives
  // Use toString instead of jQuery.type to catch host objects
  if (!obj || toString.call(obj) !== "[object Object]") {
    return false;
  }

  proto = Object.getPrototypeOf(obj);

  // Objects with no prototype (e.g., `Object.create( null )`) are plain
  if (!proto) {
    return true;
  }

  // Objects with prototype are plain iff they were constructed by a global Object function
  Ctor = {}.hasOwnProperty.call(proto, "constructor") && proto.constructor;
  return (
    typeof Ctor === "function" &&
    {}.hasOwnProperty.toString.call(Ctor) ===
      {}.hasOwnProperty.toString.call(Object)
  );
}

export function _each(obj, callback) {
  var length,
    i = 0;

  if (isArrayLike(obj)) {
    length = obj.length;
    for (; i < length; i++) {
      if (callback.call(obj[i], i, obj[i]) === false) {
        break;
      }
    }
  } else {
    for (i in obj) {
      if (callback.call(obj[i], i, obj[i]) === false) {
        break;
      }
    }
  }

  return obj;
}

export function _map(elems, callback, arg) {
  var length,
    value,
    i = 0,
    ret = [];

  // Go through the array, translating each of the items to their new values
  if (isArrayLike(elems)) {
    length = elems.length;
    for (; i < length; i++) {
      value = callback(elems[i], i, arg);

      if (value != null) {
        ret.push(value);
      }
    }

    // Go through every key on the object,
  } else {
    for (i in elems) {
      value = callback(elems[i], i, arg);

      if (value != null) {
        ret.push(value);
      }
    }
  }

  // Flatten any nested arrays
  return flat(ret);
}

export function _extend() {
  var options,
    name,
    src,
    copy,
    copyIsArray,
    clone,
    target = arguments[0] || {},
    i = 1,
    length = arguments.length,
    deep = false;

  // Handle a deep copy situation
  if (typeof target === "boolean") {
    deep = target;

    // Skip the boolean and the target
    target = arguments[i] || {};
    i++;
  }

  // Handle case when target is a string or something (possible in deep copy)
  if (typeof target !== "object" && typeof target !== "function") {
    target = {};
  }

  // Extend jQuery itself if only one argument is passed
  if (i === length) {
    target = this;
    i--;
  }

  for (; i < length; i++) {
    // Only deal with non-null/undefined values
    if ((options = arguments[i]) != null) {
      // Extend the base object
      for (name in options) {
        copy = options[name];

        // Prevent Object.prototype pollution
        // Prevent never-ending loop
        if (name === "__proto__" || target === copy) {
          continue;
        }

        // Recurse if we're merging plain objects or arrays
        if (
          deep &&
          copy &&
          (_isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))
        ) {
          src = target[name];

          // Ensure proper type for the source value
          if (copyIsArray && !Array.isArray(src)) {
            clone = [];
          } else if (!copyIsArray && !_isPlainObject(src)) {
            clone = {};
          } else {
            clone = src;
          }
          copyIsArray = false;

          // Never move original objects, clone them
          target[name] = _extend(deep, clone, copy);

          // Don't bring in undefined values
        } else if (copy !== undefined) {
          target[name] = copy;
        }
      }
    }
  }

  // Return the modified object
  return target;
}

// eslint-disable-next-line compat/compat
var flat = [].flat
  ? function (array) {
      // eslint-disable-next-line compat/compat
      return [].flat.call(array);
    }
  : function (array) {
      return [].concat.apply([], array);
    };

function isArrayLike(obj) {
  var length = !!obj && obj.length,
    type = toType(obj);

  if (typeof obj === "function" || isWindow(obj)) {
    return false;
  }

  return (
    type === "array" ||
    length === 0 ||
    (typeof length === "number" && length > 0 && length - 1 in obj)
  );
}

function toType(obj) {
  if (obj == null) {
    return obj + "";
  }

  return typeof obj === "object"
    ? {}[toString.call(obj)] || "object"
    : typeof obj;
}

function isWindow(obj) {
  return obj != null && obj === obj.window;
}
