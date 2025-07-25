import { _each, _isPlainObject } from "../core/core.internal";
import { _dt_api } from "./api.base";
import $ from "jquery";

// Can be assigned in DateTable.use() - note luxon and moment vars are in helpers.js
var __bootstrap;
var __foundation;
var __luxon; // Can be assigned in DateTable.use()
var __moment; // Can be assigned in DateTable.use()

export function _dt_getLib(type) {
  switch (type) {
    case "bootstrap":
      return __bootstrap;
    case "foundation":
      return __foundation;
    case "luxon":
      return __luxon;
    case "moment":
      return __moment;
    default:
      return null;
  }
}

export function _dt_setLib(type, newValue) {
  switch (type) {
    case "bootstrap":
      __bootstrap = newValue;
      break;
    case "foundation":
      __foundation = newValue;
      break;
    case "luxon":
      __luxon = newValue;
      break;
    case "moment":
      __moment = newValue;
      break;
    default:
      break;
  }
}

export var _dt_DateTime;

/**
 * Version string for plug-ins to check compatibility. Allowed format is
 * `a.b.c-d` where: a:int, b:int, c:int, d:string(dev|beta|alpha). `d` is used
 * only for non-release builds. See https://semver.org/ for more information.
 *  @member
 *  @type string
 *  @default Version number
 */
export var _dt_version = "2.3.2";

export var _dt_browser = {};

/**
 * Private data store, containing all of the settings objects that are
 * created for the tables on a given page.
 *
 * Note that the `DataTable.settings` object is aliased to
 * `jQuery.fn.dataTableExt` through which it may be accessed and
 * manipulated, or `jQuery.fn.dataTable.settings`.
 *  @member
 *  @type array
 *  @default []
 *  @private
 */
export var _dt_settings = [];

/**
 * Provide a common method for plug-ins to check the version of DataTables being
 * used, in order to ensure compatibility.
 *
 *  @param {string} version Version string to check for, in the format "X.Y.Z".
 *    Note that the formats "X" and "X.Y" are also acceptable.
 *  @param {string} [version2=current DataTables version] As above, but optional.
 *   If not given the current DataTables version will be used.
 *  @returns {boolean} true if this version of DataTables is greater or equal to
 *    the required version, or false if this version of DataTales is not
 *    suitable
 *  @static
 *  @dtopt API-Static
 *
 *  @example
 *    alert( $.fn.dataTable.versionCheck( '1.9.0' ) );
 */
export var _dt_versionCheck = function (version, version2) {
  var aThis = version2 ? version2.split(".") : _dt_version.split(".");
  var aThat = version.split(".");
  var iThis, iThat;

  for (var i = 0, iLen = aThat.length; i < iLen; i++) {
    iThis = parseInt(aThis[i], 10) || 0;
    iThat = parseInt(aThat[i], 10) || 0;

    // Parts are the same, keep comparing
    if (iThis === iThat) {
      continue;
    }

    // Parts are different, return immediately
    return iThis > iThat;
  }

  return true;
};

/**
 * Check if a `<table>` node is a DataTable table already or not.
 *
 *  @param {node|jquery|string} table Table node, jQuery object or jQuery
 *      selector for the table to test. Note that if more than more than one
 *      table is passed on, only the first will be checked
 *  @returns {boolean} true the table given is a DataTable, or false otherwise
 *  @static
 *  @dtopt API-Static
 *
 *  @example
 *    if ( ! $.fn.DataTable.isDataTable( '#example' ) ) {
 *      $('#example').dataTable();
 *    }
 */
export var _dt_isDataTable = function (table) {
  var t = $(table).get(0);
  var is = false;

  if (table instanceof _dt_api) {
    return true;
  }

  _each(_dt_settings, function (i, o) {
    var head = o.nScrollHead ? $("table", o.nScrollHead)[0] : null;
    var foot = o.nScrollFoot ? $("table", o.nScrollFoot)[0] : null;

    if (o.nTable === t || head === t || foot === t) {
      is = true;
    }
  });

  return is;
};

/**
 * Get all DataTable tables that have been initialised - optionally you can
 * select to get only currently visible tables.
 *
 *  @param {boolean} [visible=false] Flag to indicate if you want all (default)
 *    or visible tables only.
 *  @returns {array} Array of `table` nodes (not DataTable instances) which are
 *    DataTables
 *  @static
 *  @dtopt API-Static
 *
 *  @example
 *    _each( $.fn.dataTable.tables(true), function () {
 *      $(table).DataTable().columns.adjust();
 *    } );
 */
export var _dt_tables = function (visible) {
  var api = false;

  if (_isPlainObject(visible)) {
    api = visible.api;
    visible = visible.visible;
  }

  var a = _dt_settings
    .filter(function (o) {
      return !visible || (visible && $(o.nTable).is(":visible")) ? true : false;
    })
    .map(function (o) {
      return o.nTable;
    });

  return api ? new _dt_api(a) : a;
};
