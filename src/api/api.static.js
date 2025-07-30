import { _each, _isPlainObject } from "../core/core.jq";
import { _dt_api } from "./api.base";
import $ from "jquery";
import { _dt_settings } from "./api.settings";

export var _dt_DateTime;

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
