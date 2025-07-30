import { _dt_util_replaceable } from "../api/api.util.replaceable";
import {
  _empty,
  _re_date,
  _htmlNumeric,
  _re_html,
  _re_formatted_numeric,
  _isNumber,
} from "../core/core.internal";
import { _filterString } from "./ext.filter";
import { __numericReplace } from "./ext.sorting";

/**
 * Type based plug-ins.
 *
 * Each column in DataTables has a type assigned to it, either by automatic
 * detection or by direct assignment using the `type` option for the column.
 * The type of a column will effect how it is ordering and search (plug-ins
 * can also make use of the column type if required).
 *
 * @namespace
 */
export var _dt_ext_types = {
  /**
   * Automatic column class assignment
   */
  className: {},

  /**
   * Type detection functions.
   *
   * The functions defined in this object are used to automatically detect
   * a column's type, making initialisation of DataTables super easy, even
   * when complex data is in the table.
   *
   * The functions defined take two parameters:
   *
   *  1. `{*}` Data from the column cell to be analysed
   *  2. `{settings}` DataTables settings object. This can be used to
   *     perform context specific type detection - for example detection
   *     based on language settings such as using a comma for a decimal
   *     place. Generally speaking the options from the settings will not
   *     be required
   *
   * Each function is expected to return:
   *
   * * `{string|null}` Data type detected, or null if unknown (and thus
   *   pass it on to the other type detection functions.
   *
   *  @type array
   *
   *  @example
   *    // Currency type detection plug-in:
   *    $.fn.dataTable.ext.type.detect.push(
   *      function ( data, settings ) {
   *        // Check the numeric part
   *        if ( ! data.substring(1).match(/[0-9]/) ) {
   *          return null;
   *        }
   *
   *        // Check prefixed by currency
   *        if ( data.charAt(0) == '$' || data.charAt(0) == '&pound;' ) {
   *          return 'currency';
   *        }
   *        return null;
   *      }
   *    );
   */
  detect: [],

  /**
   * Automatic renderer assignment
   */
  render: {},

  /**
   * Type based search formatting.
   *
   * The type based searching functions can be used to pre-format the
   * data to be search on. For example, it can be used to strip HTML
   * tags or to de-format telephone numbers for numeric only searching.
   *
   * Note that is a search is not defined for a column of a given type,
   * no search formatting will be performed.
   *
   * Pre-processing of searching data plug-ins - When you assign the sType
   * for a column (or have it automatically detected for you by DataTables
   * or a type detection plug-in), you will typically be using this for
   * custom sorting, but it can also be used to provide custom searching
   * by allowing you to pre-processing the data and returning the data in
   * the format that should be searched upon. This is done by adding
   * functions this object with a parameter name which matches the sType
   * for that target column. This is the corollary of <i>afnSortData</i>
   * for searching data.
   *
   * The functions defined take a single parameter:
   *
   *  1. `{*}` Data from the column cell to be prepared for searching
   *
   * Each function is expected to return:
   *
   * * `{string|null}` Formatted string that will be used for the searching.
   *
   *  @type object
   *  @default {}
   *
   *  @example
   *    $.fn.dataTable.ext.type.search['title-numeric'] = function ( d ) {
   *      return d.replace(/\n/g," ").replace( /<.*?>/g, "" );
   *    }
   */
  search: {},

  /**
   * Type based ordering.
   *
   * The column type tells DataTables what ordering to apply to the table
   * when a column is sorted upon. The order for each type that is defined,
   * is defined by the functions available in this object.
   *
   * Each ordering option can be described by three properties added to
   * this object:
   *
   * * `{type}-pre` - Pre-formatting function
   * * `{type}-asc` - Ascending order function
   * * `{type}-desc` - Descending order function
   *
   * All three can be used together, only `{type}-pre` or only
   * `{type}-asc` and `{type}-desc` together. It is generally recommended
   * that only `{type}-pre` is used, as this provides the optimal
   * implementation in terms of speed, although the others are provided
   * for compatibility with existing Javascript sort functions.
   *
   * `{type}-pre`: Functions defined take a single parameter:
   *
   *  1. `{*}` Data from the column cell to be prepared for ordering
   *
   * And return:
   *
   * * `{*}` Data to be sorted upon
   *
   * `{type}-asc` and `{type}-desc`: Functions are typical Javascript sort
   * functions, taking two parameters:
   *
   *  1. `{*}` Data to compare to the second parameter
   *  2. `{*}` Data to compare to the first parameter
   *
   * And returning:
   *
   * * `{*}` Ordering match: <0 if first parameter should be sorted lower
   *   than the second parameter, ===0 if the two parameters are equal and
   *   >0 if the first parameter should be sorted height than the second
   *   parameter.
   *
   *  @type object
   *  @default {}
   *
   *  @example
   *    // Numeric ordering of formatted numbers with a pre-formatter
   *    _extend( $.fn.dataTable.ext.type.order, {
   *      "string-pre": function(x) {
   *        a = (a === "-" || a === "") ? 0 : a.replace( /[^\d\-\.]/g, "" );
   *        return parseFloat( a );
   *      }
   *    } );
   *
   *  @example
   *    // Case-sensitive string ordering, with no pre-formatting method
   *    _extend( $.fn.dataTable.ext.order, {
   *      "string-case-asc": function(x,y) {
   *        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
   *      },
   *      "string-case-desc": function(x,y) {
   *        return ((x < y) ? 1 : ((x > y) ? -1 : 0));
   *      }
   *    } );
   */
  order: {},
};

// Get / set type
export var _dt_type = function (name, prop, val) {
  if (!prop) {
    return {
      className: _dt_ext_types.className[name],
      detect: _dt_ext_types.detect.find(function (fn) {
        return fn._name === name;
      }),
      order: {
        pre: _dt_ext_types.order[name + "-pre"],
        asc: _dt_ext_types.order[name + "-asc"],
        desc: _dt_ext_types.order[name + "-desc"],
      },
      render: _dt_ext_types.render[name],
      search: _dt_ext_types.search[name],
    };
  }

  var setProp = function (prop, propVal) {
    _dt_ext_types[prop][name] = propVal;
  };
  var setDetect = function (detect) {
    // `detect` can be a function or an object - we set a name
    // property for either - that is used for the detection
    Object.defineProperty(detect, "_name", { value: name });

    var idx = _dt_ext_types.detect.findIndex(function (item) {
      return item._name === name;
    });

    if (idx === -1) {
      _dt_ext_types.detect.unshift(detect);
    } else {
      _dt_ext_types.detect.splice(idx, 1, detect);
    }
  };
  var setOrder = function (obj) {
    _dt_ext_types.order[name + "-pre"] = obj.pre; // can be undefined
    _dt_ext_types.order[name + "-asc"] = obj.asc; // can be undefined
    _dt_ext_types.order[name + "-desc"] = obj.desc; // can be undefined
  };

  // prop is optional
  if (val === undefined) {
    val = prop;
    prop = null;
  }

  if (prop === "className") {
    setProp("className", val);
  } else if (prop === "detect") {
    setDetect(val);
  } else if (prop === "order") {
    setOrder(val);
  } else if (prop === "render") {
    setProp("render", val);
  } else if (prop === "search") {
    setProp("search", val);
  } else if (!prop) {
    if (val.className) {
      setProp("className", val.className);
    }

    if (val.detect !== undefined) {
      setDetect(val.detect);
    }

    if (val.order) {
      setOrder(val.order);
    }

    if (val.render !== undefined) {
      setProp("render", val.render);
    }

    if (val.search !== undefined) {
      setProp("search", val.search);
    }
  }
};

// Get a list of types
export var _dt_listTypes = function () {
  return _dt_ext_types.detect.map(function (fn) {
    return fn._name;
  });
};

export function _registerBuiltInTypes(){
  _dt_type("string", _dt_type_string);
  _dt_type("string-utf8", _dt_type_stringUtf8);
  _dt_type("html", _dt_type_html);
  _dt_type("html-utf8", _dt_type_htmlUtf8);
  _dt_type("date", _dt_type_date);
  _dt_type("html-num-fmt", _dt_type_htmlNumFmt);
  _dt_type("html-num", _dt_type_htmlNum);
  _dt_type("num-fmt", _dt_type_numFmt);
  _dt_type("num", _dt_type_num);
} 

var _dt_type_string = {
  detect: function () {
    return "string";
  },
  order: {
    pre: function (a) {
      // This is a little complex, but faster than always calling toString,
      // http://jsperf.com/tostring-v-check
      return _empty(a) && typeof a !== "boolean"
        ? ""
        : typeof a === "string"
          ? a.toLowerCase()
          : !a.toString
            ? ""
            : a.toString();
    },
  },
  search: _filterString(false, true),
};

var _dt_type_stringUtf8 = {
  detect: {
    allOf: function (d) {
      return true;
    },
    oneOf: function (d) {
      // At least one data point must contain a non-ASCII character
      // This line will also check if navigator.languages is supported or not. If not (Safari 10.0-)
      // this data type won't be supported.
      // eslint-disable-next-line compat/compat
      return (
        !_empty(d) &&
        // eslint-disable-next-line compat/compat
        navigator.languages &&
        typeof d === "string" &&
        d.match(/[^\x00-\x7F]/)
      );
    },
  },
  order: {
    asc: __diacriticSort,
    desc: function (a, b) {
      return __diacriticSort(a, b) * -1;
    },
  },
  search: _filterString(false, true),
};

var _dt_type_html = {
  detect: {
    allOf: function (d) {
      return _empty(d) || (typeof d === "string" && d.indexOf("<") !== -1);
    },
    oneOf: function (d) {
      // At least one data point must contain a `<`
      return !_empty(d) && typeof d === "string" && d.indexOf("<") !== -1;
    },
  },
  order: {
    pre: function (a) {
      return _empty(a)
        ? ""
        : a.replace
          ? _dt_util_replaceable.stripHtml(a).trim().toLowerCase()
          : a + "";
    },
  },
  search: _filterString(true, true),
};

var _dt_type_htmlUtf8 = {
  detect: {
    allOf: function (d) {
      return _empty(d) || (typeof d === "string" && d.indexOf("<") !== -1);
    },
    oneOf: function (d) {
      // At least one data point must contain a `<` and a non-ASCII character
      // eslint-disable-next-line compat/compat
      return (
        // eslint-disable-next-line compat/compat
        navigator.languages &&
        !_empty(d) &&
        typeof d === "string" &&
        d.indexOf("<") !== -1 &&
        typeof d === "string" &&
        d.match(/[^\x00-\x7F]/)
      );
    },
  },
  order: {
    asc: __diacriticHtmlSort,
    desc: function (a, b) {
      return __diacriticHtmlSort(a, b) * -1;
    },
  },
  search: _filterString(true, true),
};

var _dt_type_date = {
  className: "dt-type-date",
  detect: {
    allOf: function (d) {
      // V8 tries _very_ hard to make a string passed into `Date.parse()`
      // valid, so we need to use a regex to restrict date formats. Use a
      // plug-in for anything other than ISO8601 style strings
      if (d && !(d instanceof Date) && !_re_date.test(d)) {
        return null;
      }
      var parsed = Date.parse(d);
      return (parsed !== null && !isNaN(parsed)) || _empty(d);
    },
    oneOf: function (d) {
      // At least one entry must be a date or a string with a date
      return d instanceof Date || (typeof d === "string" && _re_date.test(d));
    },
  },
  order: {
    pre: function (d) {
      var ts = Date.parse(d);
      return isNaN(ts) ? -Infinity : ts;
    },
  },
};

var _dt_type_htmlNumFmt = {
  className: "dt-type-numeric",
  detect: {
    allOf: function (d, settings) {
      var decimal = settings.oLanguage.sDecimal;
      return _htmlNumeric(d, decimal, true, false);
    },
    oneOf: function (d, settings) {
      // At least one data point must contain a numeric value
      var decimal = settings.oLanguage.sDecimal;
      return _htmlNumeric(d, decimal, true, false);
    },
  },
  order: {
    pre: function (d, s) {
      var dp = s.oLanguage.sDecimal;
      return __numericReplace(d, dp, _re_html, _re_formatted_numeric);
    },
  },
  search: _filterString(true, true),
};

var _dt_type_htmlNum = {
  className: "dt-type-numeric",
  detect: {
    allOf: function (d, settings) {
      var decimal = settings.oLanguage.sDecimal;
      return _htmlNumeric(d, decimal, false, true);
    },
    oneOf: function (d, settings) {
      // At least one data point must contain a numeric value
      var decimal = settings.oLanguage.sDecimal;
      return _htmlNumeric(d, decimal, false, false);
    },
  },
  order: {
    pre: function (d, s) {
      var dp = s.oLanguage.sDecimal;
      return __numericReplace(d, dp, _re_html);
    },
  },
  search: _filterString(true, true),
};

var _dt_type_numFmt = {
  className: "dt-type-numeric",
  detect: {
    allOf: function (d, settings) {
      var decimal = settings.oLanguage.sDecimal;
      return _isNumber(d, decimal, true, true);
    },
    oneOf: function (d, settings) {
      // At least one data point must contain a numeric value
      var decimal = settings.oLanguage.sDecimal;
      return _isNumber(d, decimal, true, false);
    },
  },
  order: {
    pre: function (d, s) {
      var dp = s.oLanguage.sDecimal;
      return __numericReplace(d, dp, _re_formatted_numeric);
    },
  },
};

var _dt_type_num = {
  className: "dt-type-numeric",
  detect: {
    allOf: function (d, settings) {
      var decimal = settings.oLanguage.sDecimal;
      return _isNumber(d, decimal, false, true);
    },
    oneOf: function (d, settings) {
      // At least one data point must contain a numeric value
      var decimal = settings.oLanguage.sDecimal;
      return _isNumber(d, decimal, false, false);
    },
  },
  order: {
    pre: function (d, s) {
      var dp = s.oLanguage.sDecimal;
      return __numericReplace(d, dp);
    },
  },
};

var __diacriticSort = function (a, b) {
  a = a !== null && a !== undefined ? a.toString().toLowerCase() : "";
  b = b !== null && b !== undefined ? b.toString().toLowerCase() : "";

  // Checked for `navigator.languages` support in `oneOf` so this code can't execute in old
  // Safari and thus can disable this check
  // eslint-disable-next-line compat/compat
  return a.localeCompare(b, navigator.languages[0] || navigator.language, {
    numeric: true,
    ignorePunctuation: true,
  });
};

var __diacriticHtmlSort = function (a, b) {
  a = _dt_util_replaceable.stripHtml(a);
  b = _dt_util_replaceable.stripHtml(b);

  return __diacriticSort(a, b);
};
