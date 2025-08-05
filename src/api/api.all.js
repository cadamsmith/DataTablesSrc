import { _flatten, _intVal, _pluck, _pluck_order, _range, _removeEmpty, _unique } from '../core/core.internal.js';
import $ from 'jquery';
import { _dt_settings } from './api.settings.js';
import { _fnArrayApply, _fnCallbackFire, _fnDataSource, _fnLengthOverflow, _fnLog } from '../core/core.support.js';
import { _dt_util } from './api.util.js';
import { _fnDraw, _fnDrawHead, _fnHeaderLayout, _fnReDraw } from '../core/core.draw.js';
import { _fnSort, _fnSortAttachListener, _fnSortDisplay, _fnSortingClasses } from '../core/core.sort.js';
import { _fnPageChange } from '../core/core.page.js';
import { _fnLengthChange } from '../core/core.length.js';
import { _fnProcessingDisplay } from '../core/core.processing.js';
import { _fnAjaxDataSrc, _fnBuildAjax } from '../core/core.ajax.js';
import {
  _fnAddData,
  _fnAddTr,
  _fnClearTable,
  _fnGetCellData, _fnGetObjectDataFn,
  _fnInvalidate, _fnSetCellData,
  _fnSetObjectDataFn,
} from '../core/core.data.js';
import { _fnInitComplete } from '../core/core.initComplete.js';
import { _dt_ext_selector } from '../ext/ext.selector.js';
import {
  _colGroup, _fnAdjustColumnSizing, _fnColumnIndexToVisible,
  _fnColumnsFromHeader,
  _fnColumnTypes,
  _fnVisbleColumns,
  _fnVisibleToColumnIndex,
} from '../core/core.columns.js';
import { _fnImplementState, _fnSaveState } from '../core/core.state.js';
import { _fnSortFlatten, _fnSortResolve } from '../core/core.sortAlgo.js';
import { _fnFilterComplete } from '../core/core.filter.js';
import { _dt_ext_types } from '../ext/ext.types.js';

/**
 * Computed structure of the DataTables API, defined by the options passed to
 * `DataTable.Api.register()` when building the API.
 *
 * The structure is built in order to speed creation and extension of the Api
 * objects since the extensions are effectively pre-parsed.
 *
 * The array is an array of objects with the following structure, where this
 * base array represents the Api prototype base:
 *
 *     [
 *       {
 *         name:      'data'                -- string   - Property name
 *         val:       function () {},       -- function - Api method (or undefined if just an object
 *         methodExt: [ ... ],              -- array    - Array of Api object definitions to extend the method result
 *         propExt:   [ ... ]               -- array    - Array of Api object definitions to extend the property
 *       },
 *       {
 *         name:     'row'
 *         val:       {},
 *         methodExt: [ ... ],
 *         propExt:   [
 *           {
 *             name:      'data'
 *             val:       function () {},
 *             methodExt: [ ... ],
 *             propExt:   [ ... ]
 *           },
 *           ...
 *         ]
 *       }
 *     ]
 *
 * @type {Array}
 * @ignore
 */
var __apiStruct = [];

/**
 * `Array.prototype` reference.
 *
 * @type object
 * @ignore
 */
var __arrayProto = Array.prototype;

/**
 * Abstraction for `context` parameter of the `Api` constructor to allow it to
 * take several different forms for ease of use.
 *
 * Each of the input parameter types will be converted to a DataTables settings
 * object where possible.
 *
 * @param  {string|node|jQuery|object} mixed DataTable identifier. Can be one
 *   of:
 *
 *   * `string` - jQuery selector. Any DataTables' matching the given selector
 *     with be found and used.
 *   * `node` - `TABLE` node which has already been formed into a DataTable.
 *   * `jQuery` - A jQuery object of `TABLE` nodes.
 *   * `object` - DataTables settings object
 *   * `DataTables.Api` - API instance
 * @return {array|null} Matching DataTables settings objects. `null` or
 *   `undefined` is returned if no matching DataTable is found.
 * @ignore
 */
var _toSettings = function (mixed) {
  var idx, jq;
  var settings = _dt_settings;
  var tables = _pluck(settings, 'nTable');

  if (!mixed) {
    return [];
  } else if (mixed.nTable && mixed.oFeatures) {
    // DataTables settings object
    return [mixed];
  } else if (mixed.nodeName && mixed.nodeName.toLowerCase() === 'table') {
    // Table node
    idx = tables.indexOf(mixed);
    return idx !== -1 ? [settings[idx]] : null;
  } else if (mixed && typeof mixed.settings === 'function') {
    return mixed.settings().toArray();
  } else if (typeof mixed === 'string') {
    // jQuery selector
    jq = $(mixed).get();
  } else if (mixed instanceof $) {
    // jQuery object (also DataTables instance)
    jq = mixed.get();
  }

  if (jq) {
    return settings.filter(function (v, idx) {
      return jq.includes(tables[idx]);
    });
  }
};

/**
 * DataTables API class - used to control and interface with  one or more
 * DataTables enhanced tables.
 *
 * The API class is heavily based on jQuery, presenting a chainable interface
 * that you can use to interact with tables. Each instance of the API class has
 * a "context" - i.e. the tables that it will operate on. This could be a single
 * table, all tables on a page or a sub-set thereof.
 *
 * Additionally the API is designed to allow you to easily work with the data in
 * the tables, retrieving and manipulating it as required. This is done by
 * presenting the API class as an array like interface. The contents of the
 * array depend upon the actions requested by each method (for example
 * `rows().nodes()` will return an array of nodes, while `rows().data()` will
 * return an array of objects or arrays depending upon your table's
 * configuration). The API object has a number of array like methods (`push`,
 * `pop`, `reverse` etc) as well as additional helper methods (`each`, `pluck`,
 * `unique` etc) to assist your working with the data held in a table.
 *
 * Most methods (those which return an Api instance) are chainable, which means
 * the return from a method call also has all of the methods available that the
 * top level object had. For example, these two calls are equivalent:
 *
 *     // Not chained
 *     api.row.add( {...} );
 *     api.draw();
 *
 *     // Chained
 *     api.row.add( {...} ).draw();
 *
 * @class DataTable.Api
 * @param {array|object|string|jQuery} context DataTable identifier. This is
 *   used to define which DataTables enhanced tables this API will operate on.
 *   Can be one of:
 *
 *   * `string` - jQuery selector. Any DataTables' matching the given selector
 *     with be found and used.
 *   * `node` - `TABLE` node which has already been formed into a DataTable.
 *   * `jQuery` - A jQuery object of `TABLE` nodes.
 *   * `object` - DataTables settings object
 * @param {array} [data] Data to initialise the Api instance with.
 *
 * @example
 *   // Direct initialisation during DataTables construction
 *   var api = $('#example').DataTable();
 *
 * @example
 *   // Initialisation using a DataTables jQuery object
 *   var api = $('#example').dataTable().api();
 *
 * @example
 *   // Initialisation as a constructor
 *   var api = new DataTable.Api( 'table.dataTable' );
 */
var _dt_api = function (context, data) {
  if (!(this instanceof _dt_api)) {
    return new _dt_api(context, data);
  }

  var i;
  var settings = [];
  var ctxSettings = function (o) {
    var a = _toSettings(o);
    if (a) {
      settings.push.apply(settings, a);
    }
  };

  if (Array.isArray(context)) {
    for (i = 0; i < context.length; i++) {
      ctxSettings(context[i]);
    }
  } else {
    ctxSettings(context);
  }

  // Remove duplicates
  this.context = settings.length > 1 ? _unique(settings) : settings;

  // Initial data
  _fnArrayApply(this, data);

  // selector
  this.selector = {
    rows: null,
    cols: null,
    opts: null,
  };

  _dt_api.extend(this, this, __apiStruct);
};

// Don't destroy the existing prototype, just extend it. Required for jQuery 2's
// isPlainObject.
$.extend(_dt_api.prototype, {
  any: function () {
    return this.count() !== 0;
  },

  context: [], // array of table settings objects

  count: function () {
    return this.flatten().length;
  },

  each: function (fn) {
    for (var i = 0, ien = this.length; i < ien; i++) {
      fn.call(this, this[i], i, this);
    }

    return this;
  },

  eq: function (idx) {
    var ctx = this.context;

    return ctx.length > idx ? new _dt_api(ctx[idx], this[idx]) : null;
  },

  filter: function (fn) {
    var a = __arrayProto.filter.call(this, fn, this);

    return new _dt_api(this.context, a);
  },

  flatten: function () {
    var a = [];

    return new _dt_api(this.context, a.concat.apply(a, this.toArray()));
  },

  get: function (idx) {
    return this[idx];
  },

  join: __arrayProto.join,

  includes: function (find) {
    return this.indexOf(find) === -1 ? false : true;
  },

  indexOf: __arrayProto.indexOf,

  iterator: function (flatten, type, fn, alwaysNew) {
    var a = [],
      ret,
      i,
      ien,
      j,
      jen,
      context = this.context,
      rows,
      items,
      item,
      selector = this.selector;

    // Argument shifting
    if (typeof flatten === 'string') {
      alwaysNew = fn;
      fn = type;
      type = flatten;
      flatten = false;
    }

    for (i = 0, ien = context.length; i < ien; i++) {
      var apiInst = new _dt_api(context[i]);

      if (type === 'table') {
        ret = fn.call(apiInst, context[i], i);

        if (ret !== undefined) {
          a.push(ret);
        }
      } else if (type === 'columns' || type === 'rows') {
        // this has same length as context - one entry for each table
        ret = fn.call(apiInst, context[i], this[i], i);

        if (ret !== undefined) {
          a.push(ret);
        }
      } else if (
        type === 'every' ||
        type === 'column' ||
        type === 'column-rows' ||
        type === 'row' ||
        type === 'cell'
      ) {
        // columns and rows share the same structure.
        // 'this' is an array of column indexes for each context
        items = this[i];

        if (type === 'column-rows') {
          rows = _selector_row_indexes(context[i], selector.opts);
        }

        for (j = 0, jen = items.length; j < jen; j++) {
          item = items[j];

          if (type === 'cell') {
            ret = fn.call(apiInst, context[i], item.row, item.column, i, j);
          } else {
            ret = fn.call(apiInst, context[i], item, i, j, rows);
          }

          if (ret !== undefined) {
            a.push(ret);
          }
        }
      }
    }

    if (a.length || alwaysNew) {
      var api = new _dt_api(context, flatten ? a.concat.apply([], a) : a);
      var apiSelector = api.selector;
      apiSelector.rows = selector.rows;
      apiSelector.cols = selector.cols;
      apiSelector.opts = selector.opts;
      return api;
    }
    return this;
  },

  lastIndexOf: __arrayProto.lastIndexOf,

  length: 0,

  map: function (fn) {
    var a = __arrayProto.map.call(this, fn, this);

    return new _dt_api(this.context, a);
  },

  pluck: function (prop) {
    var fn = _dt_util.get(prop);

    return this.map(function (el) {
      return fn(el);
    });
  },

  pop: __arrayProto.pop,

  push: __arrayProto.push,

  reduce: __arrayProto.reduce,

  reduceRight: __arrayProto.reduceRight,

  reverse: __arrayProto.reverse,

  // Object with rows, columns and opts
  selector: null,

  shift: __arrayProto.shift,

  slice: function () {
    return new _dt_api(this.context, this);
  },

  sort: __arrayProto.sort,

  splice: __arrayProto.splice,

  toArray: function () {
    return __arrayProto.slice.call(this);
  },

  to$: function () {
    return $(this);
  },

  toJQuery: function () {
    return $(this);
  },

  unique: function () {
    return new _dt_api(this.context, _unique(this.toArray()));
  },

  unshift: __arrayProto.unshift,
});

function _api_scope(scope, fn, struc) {
  return function () {
    var ret = fn.apply(scope || this, arguments);

    // Method extension
    _dt_api.extend(ret, ret, struc.methodExt);
    return ret;
  };
}

function _api_find(src, name) {
  for (var i = 0, ien = src.length; i < ien; i++) {
    if (src[i].name === name) {
      return src[i];
    }
  }
  return null;
}

window.__apiStruct = __apiStruct;

_dt_api.extend = function (scope, obj, ext) {
  // Only extend API instances and static properties of the API
  if (!ext.length || !obj || (!(obj instanceof _dt_api) && !obj.__dt_wrapper)) {
    return;
  }

  var i, ien, struct;

  for (i = 0, ien = ext.length; i < ien; i++) {
    struct = ext[i];

    if (struct.name === '__proto__') {
      continue;
    }

    // Value
    obj[struct.name] =
      struct.type === 'function'
        ? _api_scope(scope, struct.val, struct)
        : struct.type === 'object'
          ? {}
          : struct.val;

    obj[struct.name].__dt_wrapper = true;

    // Property extension
    _dt_api.extend(scope, obj[struct.name], struct.propExt);
  }
};

//     [
//       {
//         name:      'data'                -- string   - Property name
//         val:       function () {},       -- function - Api method (or undefined if just an object
//         methodExt: [ ... ],              -- array    - Array of Api object definitions to extend the method result
//         propExt:   [ ... ]               -- array    - Array of Api object definitions to extend the property
//       },
//       {
//         name:     'row'
//         val:       {},
//         methodExt: [ ... ],
//         propExt:   [
//           {
//             name:      'data'
//             val:       function () {},
//             methodExt: [ ... ],
//             propExt:   [ ... ]
//           },
//           ...
//         ]
//       }
//     ]

_dt_api.register = function (name, val) {
  if (Array.isArray(name)) {
    for (var j = 0, jen = name.length; j < jen; j++) {
      _dt_api.register(name[j], val);
    }
    return;
  }

  var i,
    ien,
    heir = name.split('.'),
    struct = __apiStruct,
    key,
    method;

  for (i = 0, ien = heir.length; i < ien; i++) {
    method = heir[i].indexOf('()') !== -1;
    key = method ? heir[i].replace('()', '') : heir[i];

    var src = _api_find(struct, key);
    if (!src) {
      src = {
        name: key,
        val: {},
        methodExt: [],
        propExt: [],
        type: 'object',
      };
      struct.push(src);
    }

    if (i === ien - 1) {
      src.val = val;
      src.type =
        typeof val === 'function'
          ? 'function'
          : $.isPlainObject(val)
            ? 'object'
            : 'other';
    } else {
      struct = method ? src.methodExt : src.propExt;
    }
  }
};

_dt_api.registerPlural = function (
  pluralName,
  singularName,
  val
) {
  _dt_api.register(pluralName, val);

  _dt_api.register(singularName, function () {
    var ret = val.apply(this, arguments);

    if (ret === this) {
      // Returned item is the API instance that was passed in, return it
      return this;
    } else if (ret instanceof _dt_api) {
      // New API instance returned, want the value from the first item
      // in the returned array for the singular result.
      return ret.length
        ? Array.isArray(ret[0])
          ? new _dt_api(ret.context, ret[0]) // Array results are 'enhanced'
          : ret[0]
        : undefined;
    }

    // Non-API return - just fire it back
    return ret;
  });
};

// [[API.TABLE]]

/**
 * Selector for HTML tables. Apply the given selector to the give array of
 * DataTables settings objects.
 *
 * @param {string|integer} [selector] jQuery selector string or integer
 * @param  {array} Array of DataTables settings objects to be filtered
 * @return {array}
 * @ignore
 */
var __table_selector = function (selector, a) {
  if (Array.isArray(selector)) {
    var result = [];

    selector.forEach(function (sel) {
      var inner = __table_selector(sel, a);

      _fnArrayApply(result, inner);
    });

    return result.filter(function (item) {
      return item;
    });
  }

  // Integer is used to pick out a table by index
  if (typeof selector === 'number') {
    return [a[selector]];
  }

  // Perform a jQuery selector on the table nodes
  var nodes = a.map(function (el) {
    return el.nTable;
  });

  return $(nodes)
    .filter(selector)
    .map(function () {
      // Need to translate back from the table node to the settings
      var idx = nodes.indexOf(this);
      return a[idx];
    })
    .toArray();
};

/**
 * Context selector for the API's context (i.e. the tables the API instance
 * refers to.
 *
 * @name    DataTable.Api#tables
 * @param {string|integer} [selector] Selector to pick which tables the iterator
 *   should operate on. If not given, all tables in the current context are
 *   used. This can be given as a jQuery selector (for example `':gt(0)'`) to
 *   select multiple tables or as an integer to select a single table.
 * @returns {DataTable.Api} Returns a new API instance if a selector is given.
 */
_dt_api.register('tables()', function (selector) {
  // A new instance is created if there was a selector specified
  return selector !== undefined && selector !== null
    ? new _dt_api(__table_selector(selector, this.context))
    : this;
});

_dt_api.register('table()', function (selector) {
  var tables = this.tables(selector);
  var ctx = tables.context;

  // Truncate to the first matched table
  return ctx.length ? new _dt_api(ctx[0]) : tables;
});

// Common methods, combined to reduce size
[
  ['nodes', 'node', 'nTable'],
  ['body', 'body', 'nTBody'],
  ['header', 'header', 'nTHead'],
  ['footer', 'footer', 'nTFoot'],
].forEach(function (item) {
  _dt_api.registerPlural(
    'tables().' + item[0] + '()',
    'table().' + item[1] + '()',
    function () {
      return this.iterator(
        'table',
        function (ctx) {
          return ctx[item[2]];
        },
        1
      );
    }
  );
});

// Structure methods
[
  ['header', 'aoHeader'],
  ['footer', 'aoFooter'],
].forEach(function (item) {
  _dt_api.register('table().' + item[0] + '.structure()', function (selector) {
    var indexes = this.columns(selector).indexes().flatten().toArray();
    var ctx = this.context[0];
    var structure = _fnHeaderLayout(ctx, ctx[item[1]], indexes);

    // The structure is in column index order - but from this method we want the return to be
    // in the columns() selector API order. In order to do that we need to map from one form
    // to the other
    var orderedIndexes = indexes.slice().sort(function (a, b) {
      return a - b;
    });

    return structure.map(function (row) {
      return indexes.map(function (colIdx) {
        return row[orderedIndexes.indexOf(colIdx)];
      });
    });
  });
});

_dt_api.registerPlural(
  'tables().containers()',
  'table().container()',
  function () {
    return this.iterator(
      'table',
      function (ctx) {
        return ctx.nTableWrapper;
      },
      1
    );
  }
);

_dt_api.register('tables().every()', function (fn) {
  var that = this;

  return this.iterator('table', function (s, i) {
    fn.call(that.table(i), i);
  });
});

_dt_api.register('caption()', function (value, side) {
  var context = this.context;

  // Getter - return existing node's content
  if (value === undefined) {
    var caption = context[0].captionNode;

    return caption && context.length ? caption.innerHTML : null;
  }

  return this.iterator(
    'table',
    function (ctx) {
      var table = $(ctx.nTable);
      var caption = $(ctx.captionNode);
      var container = $(ctx.nTableWrapper);

      // Create the node if it doesn't exist yet
      if (!caption.length) {
        caption = $('<caption/>').html(value);
        ctx.captionNode = caption[0];

        // If side isn't set, we need to insert into the document to let the
        // CSS decide so we can read it back, otherwise there is no way to
        // know if the CSS would put it top or bottom for scrolling
        if (!side) {
          table.prepend(caption);

          side = caption.css('caption-side');
        }
      }

      caption.html(value);

      if (side) {
        caption.css('caption-side', side);
        caption[0]._captionSide = side;
      }

      if (container.find('div.dataTables_scroll').length) {
        var selector = side === 'top' ? 'Head' : 'Foot';

        container
          .find('div.dataTables_scroll' + selector + ' table')
          .prepend(caption);
      } else {
        table.prepend(caption);
      }
    },
    1
  );
});

_dt_api.register('caption.node()', function () {
  var ctx = this.context;

  return ctx.length ? ctx[0].captionNode : null;
});

// [[API.DRAW]]

/**
 * Redraw the tables in the current context.
 */
_dt_api.register('draw()', function (paging) {
  return this.iterator('table', function (settings) {
    if (paging === 'page') {
      _fnDraw(settings);
    } else {
      if (typeof paging === 'string') {
        paging = paging === 'full-hold' ? false : true;
      }

      _fnReDraw(settings, paging === false, undefined, _fnSort);
    }
  });
});

// [[ API.PAGE ]]

/**
 * Get the current page index.
 *
 * @return {integer} Current page index (zero based)
 */
/**
 * Set the current page.
 *
 * Note that if you attempt to show a page which does not exist, DataTables will
 * not throw an error, but rather reset the paging.
 *
 * @param {integer|string} action The paging action to take. This can be one of:
 *  * `integer` - The page index to jump to
 *  * `string` - An action to take:
 *    * `first` - Jump to first page.
 *    * `next` - Jump to the next page
 *    * `previous` - Jump to previous page
 *    * `last` - Jump to the last page.
 * @returns {DataTables.Api} this
 */
_dt_api.register('page()', function (action) {
  if (action === undefined) {
    return this.page.info().page; // not an expensive call
  }

  // else, have an action to take on all tables
  return this.iterator('table', function (settings) {
    _fnPageChange(settings, action);
  });
});

/**
 * Paging information for the first table in the current context.
 *
 * If you require paging information for another table, use the `table()` method
 * with a suitable selector.
 *
 * @return {object} Object with the following properties set:
 *  * `page` - Current page index (zero based - i.e. the first page is `0`)
 *  * `pages` - Total number of pages
 *  * `start` - Display index for the first record shown on the current page
 *  * `end` - Display index for the last record shown on the current page
 *  * `length` - Display length (number of records). Note that generally `start
 *    + length = end`, but this is not always true, for example if there are
 *    only 2 records to show on the final page, with a length of 10.
 *  * `recordsTotal` - Full data set length
 *  * `recordsDisplay` - Data set length once the current filtering criterion
 *    are applied.
 */
_dt_api.register('page.info()', function () {
  if (this.context.length === 0) {
    return undefined;
  }

  var settings = this.context[0],
    start = settings._iDisplayStart,
    len = settings.oFeatures.bPaginate ? settings._iDisplayLength : -1,
    visRecords = settings.fnRecordsDisplay(),
    all = len === -1;

  return {
    page: all ? 0 : Math.floor(start / len),
    pages: all ? 1 : Math.ceil(visRecords / len),
    start: start,
    end: settings.fnDisplayEnd(),
    length: len,
    recordsTotal: settings.fnRecordsTotal(),
    recordsDisplay: visRecords,
    serverSide: _fnDataSource(settings) === 'ssp',
  };
});

/**
 * Get the current page length.
 *
 * @return {integer} Current page length. Note `-1` indicates that all records
 *   are to be shown.
 */
/**
 * Set the current page length.
 *
 * @param {integer} Page length to set. Use `-1` to show all records.
 * @returns {DataTables.Api} this
 */
_dt_api.register('page.len()', function (len) {
  // Note that we can't call this function 'length()' because `length`
  // is a Javascript property of functions which defines how many arguments
  // the function expects.
  if (len === undefined) {
    return this.context.length !== 0
      ? this.context[0]._iDisplayLength
      : undefined;
  }

  // else, set the page length
  return this.iterator('table', function (settings) {
    _fnLengthChange(settings, len);
  });
});

// [[ API.AJAX ]]

var __reload = function (settings, holdPosition, callback) {
  // Use the draw event to trigger a callback
  if (callback) {
    var api = new _dt_api(settings);

    api.one('draw', function () {
      callback(api.ajax.json());
    });
  }

  if (_fnDataSource(settings) == 'ssp') {
    _fnReDraw(settings, holdPosition, undefined, _fnSort);
  } else {
    _fnProcessingDisplay(settings, true);

    // Cancel an existing request
    var xhr = settings.jqXHR;
    if (xhr && xhr.readyState !== 4) {
      xhr.abort();
    }

    // Trigger xhr
    _fnBuildAjax(settings, {}, function (json) {
      _fnClearTable(settings);

      var data = _fnAjaxDataSrc(settings, json);
      for (var i = 0, ien = data.length; i < ien; i++) {
        _fnAddData(settings, data[i]);
      }

      _fnReDraw(settings, holdPosition, undefined, _fnSort);
      _fnInitComplete(settings);
      _fnProcessingDisplay(settings, false);
    });
  }
};

/**
 * Get the JSON response from the last Ajax request that DataTables made to the
 * server. Note that this returns the JSON from the first table in the current
 * context.
 *
 * @return {object} JSON received from the server.
 */
_dt_api.register('ajax.json()', function () {
  var ctx = this.context;

  if (ctx.length > 0) {
    return ctx[0].json;
  }

  // else return undefined;
});

/**
 * Get the data submitted in the last Ajax request
 */
_dt_api.register('ajax.params()', function () {
  var ctx = this.context;

  if (ctx.length > 0) {
    return ctx[0].oAjaxData;
  }

  // else return undefined;
});

/**
 * Reload tables from the Ajax data source. Note that this function will
 * automatically re-draw the table when the remote data has been loaded.
 *
 * @param {boolean} [reset=true] Reset (default) or hold the current paging
 *   position. A full re-sort and re-filter is performed when this method is
 *   called, which is why the pagination reset is the default action.
 * @returns {DataTables.Api} this
 */
_dt_api.register('ajax.reload()', function (callback, resetPaging) {
  return this.iterator('table', function (settings) {
    __reload(settings, resetPaging === false, callback);
  });
});

/**
 * Get the current Ajax URL. Note that this returns the URL from the first
 * table in the current context.
 *
 * @return {string} Current Ajax source URL
 */
/**
 * Set the Ajax URL. Note that this will set the URL for all tables in the
 * current context.
 *
 * @param {string} url URL to set.
 * @returns {DataTables.Api} this
 */
_dt_api.register('ajax.url()', function (url) {
  var ctx = this.context;

  if (url === undefined) {
    // get
    if (ctx.length === 0) {
      return undefined;
    }
    ctx = ctx[0];

    return $.isPlainObject(ctx.ajax) ? ctx.ajax.url : ctx.ajax;
  }

  // set
  return this.iterator('table', function (settings) {
    if ($.isPlainObject(settings.ajax)) {
      settings.ajax.url = url;
    } else {
      settings.ajax = url;
    }
  });
});

/**
 * Load data from the newly set Ajax URL. Note that this method is only
 * available when `ajax.url()` is used to set a URL. Additionally, this method
 * has the same effect as calling `ajax.reload()` but is provided for
 * convenience when setting a new URL. Like `ajax.reload()` it will
 * automatically redraw the table once the remote data has been loaded.
 *
 * @returns {DataTables.Api} this
 */
_dt_api.register('ajax.url().load()', function (callback, resetPaging) {
  // Same as a reload, but makes sense to present it for easy access after a
  // url change
  return this.iterator('table', function (ctx) {
    __reload(ctx, resetPaging === false, callback);
  });
});

// [[ API.SELECTORS ]]

var _selector_run = function (type, selector, selectFn, settings, opts) {
  var out = [],
    res,
    i,
    ien,
    selectorType = typeof selector;

  // Can't just check for isArray here, as an API or jQuery instance might be
  // given with their array like look
  if (
    !selector ||
    selectorType === 'string' ||
    selectorType === 'function' ||
    selector.length === undefined
  ) {
    selector = [selector];
  }

  for (i = 0, ien = selector.length; i < ien; i++) {
    res = selectFn(
      typeof selector[i] === 'string' ? selector[i].trim() : selector[i]
    );

    // Remove empty items
    res = res.filter(function (item) {
      return item !== null && item !== undefined;
    });

    if (res && res.length) {
      out = out.concat(res);
    }
  }

  // selector extensions
  var ext = _dt_ext_selector[type];
  if (ext.length) {
    for (i = 0, ien = ext.length; i < ien; i++) {
      out = ext[i](settings, opts, out);
    }
  }

  return _unique(out);
};

var _selector_opts = function (opts) {
  if (!opts) {
    opts = {};
  }

  // Backwards compatibility for 1.9- which used the terminology filter rather
  // than search
  if (opts.filter && opts.search === undefined) {
    opts.search = opts.filter;
  }

  return $.extend(
    {
      columnOrder: 'implied',
      search: 'none',
      order: 'current',
      page: 'all',
    },
    opts
  );
};

// Reduce the API instance to the first item found
var _selector_first = function (old) {
  var inst = new _dt_api(old.context[0]);

  // Use a push rather than passing to the constructor, since it will
  // merge arrays down automatically, which isn't what is wanted here
  if (old.length) {
    inst.push(old[0]);
  }

  inst.selector = old.selector;

  // Limit to a single row / column / cell
  if (inst.length && inst[0].length > 1) {
    inst[0].splice(1);
  }

  return inst;
};

var _selector_row_indexes = function (settings, opts) {
  var i,
    ien,
    tmp,
    a = [],
    displayFiltered = settings.aiDisplay,
    displayMaster = settings.aiDisplayMaster;

  var search = opts.search, // none, applied, removed
    order = opts.order, // applied, current, index (original - compatibility with 1.9)
    page = opts.page; // all, current

  if (_fnDataSource(settings) == 'ssp') {
    // In server-side processing mode, most options are irrelevant since
    // rows not shown don't exist and the index order is the applied order
    // Removed is a special case - for consistency just return an empty
    // array
    return search === 'removed' ? [] : _range(0, displayMaster.length);
  }

  if (page == 'current') {
    // Current page implies that order=current and filter=applied, since it is
    // fairly senseless otherwise, regardless of what order and search actually
    // are
    for (
      i = settings._iDisplayStart, ien = settings.fnDisplayEnd();
      i < ien;
      i++
    ) {
      a.push(displayFiltered[i]);
    }
  } else if (order == 'current' || order == 'applied') {
    if (search == 'none') {
      a = displayMaster.slice();
    } else if (search == 'applied') {
      a = displayFiltered.slice();
    } else if (search == 'removed') {
      // O(n+m) solution by creating a hash map
      var displayFilteredMap = {};

      for (i = 0, ien = displayFiltered.length; i < ien; i++) {
        displayFilteredMap[displayFiltered[i]] = null;
      }

      displayMaster.forEach(function (item) {
        if (!Object.prototype.hasOwnProperty.call(displayFilteredMap, item)) {
          a.push(item);
        }
      });
    }
  } else if (order == 'index' || order == 'original') {
    for (i = 0, ien = settings.aoData.length; i < ien; i++) {
      if (!settings.aoData[i]) {
        continue;
      }

      if (search == 'none') {
        a.push(i);
      } else {
        // applied | removed
        tmp = displayFiltered.indexOf(i);

        if (
          (tmp === -1 && search == 'removed') ||
          (tmp >= 0 && search == 'applied')
        ) {
          a.push(i);
        }
      }
    }
  } else if (typeof order === 'number') {
    // Order the rows by the given column
    var ordered = _fnSort(settings, order, 'asc');

    if (search === 'none') {
      a = ordered;
    } else {
      // applied | removed
      for (i = 0; i < ordered.length; i++) {
        tmp = displayFiltered.indexOf(ordered[i]);

        if (
          (tmp === -1 && search == 'removed') ||
          (tmp >= 0 && search == 'applied')
        ) {
          a.push(ordered[i]);
        }
      }
    }
  }

  return a;
};

// [[ API.ROWS ]]

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Rows
 *
 * {}          - no selector - use all available rows
 * {integer}   - row aoData index
 * {node}      - TR node
 * {string}    - jQuery selector to apply to the TR elements
 * {array}     - jQuery array of nodes, or simply an array of TR nodes
 *
 */
var __row_selector = function (settings, selector, opts) {
  var rows;
  var run = function (sel) {
    var selInt = _intVal(sel);
    var aoData = settings.aoData;

    // Short cut - selector is a number and no options provided (default is
    // all records, so no need to check if the index is in there, since it
    // must be - dev error if the index doesn't exist).
    if (selInt !== null && !opts) {
      return [selInt];
    }

    if (!rows) {
      rows = _selector_row_indexes(settings, opts);
    }

    if (selInt !== null && rows.indexOf(selInt) !== -1) {
      // Selector - integer
      return [selInt];
    } else if (sel === null || sel === undefined || sel === '') {
      // Selector - none
      return rows;
    }

    // Selector - function
    if (typeof sel === 'function') {
      return rows.map(function (idx) {
        var row = aoData[idx];
        return sel(idx, row._aData, row.nTr) ? idx : null;
      });
    }

    // Selector - node
    if (sel.nodeName) {
      var rowIdx = sel._DT_RowIndex; // Property added by DT for fast lookup
      var cellIdx = sel._DT_CellIndex;

      if (rowIdx !== undefined) {
        // Make sure that the row is actually still present in the table
        return aoData[rowIdx] && aoData[rowIdx].nTr === sel ? [rowIdx] : [];
      } else if (cellIdx) {
        return aoData[cellIdx.row] && aoData[cellIdx.row].nTr === sel.parentNode
          ? [cellIdx.row]
          : [];
      } else {
        var host = $(sel).closest('*[data-dt-row]');
        return host.length ? [host.data('dt-row')] : [];
      }
    }

    // ID selector. Want to always be able to select rows by id, regardless
    // of if the tr element has been created or not, so can't rely upon
    // jQuery here - hence a custom implementation. This does not match
    // Sizzle's fast selector or HTML4 - in HTML5 the ID can be anything,
    // but to select it using a CSS selector engine (like Sizzle or
    // querySelect) it would need to need to be escaped for some characters.
    // DataTables simplifies this for row selectors since you can select
    // only a row. A # indicates an id any anything that follows is the id -
    // unescaped.
    if (typeof sel === 'string' && sel.charAt(0) === '#') {
      // get row index from id
      var rowObj = settings.aIds[sel.replace(/^#/, '')];
      if (rowObj !== undefined) {
        return [rowObj.idx];
      }

      // need to fall through to jQuery in case there is DOM id that
      // matches
    }

    // Get nodes in the order from the `rows` array with null values removed
    var nodes = _removeEmpty(_pluck_order(settings.aoData, rows, 'nTr'));

    // Selector - jQuery selector string, array of nodes or jQuery object/
    // As jQuery's .filter() allows jQuery objects to be passed in filter,
    // it also allows arrays, so this will cope with all three options
    return $(nodes)
      .filter(sel)
      .map(function () {
        return this._DT_RowIndex;
      })
      .toArray();
  };

  var matched = _selector_run('row', selector, run, settings, opts);

  if (opts.order === 'current' || opts.order === 'applied') {
    _fnSortDisplay(settings, matched);
  }

  return matched;
};

_dt_api.register('rows()', function (selector, opts) {
  // argument shifting
  if (selector === undefined) {
    selector = '';
  } else if ($.isPlainObject(selector)) {
    opts = selector;
    selector = '';
  }

  opts = _selector_opts(opts);

  var inst = this.iterator(
    'table',
    function (settings) {
      return __row_selector(settings, selector, opts);
    },
    1
  );

  // Want argument shifting here and in __row_selector?
  inst.selector.rows = selector;
  inst.selector.opts = opts;

  return inst;
});

_dt_api.register('rows().nodes()', function () {
  return this.iterator(
    'row',
    function (settings, row) {
      return settings.aoData[row].nTr || undefined;
    },
    1
  );
});

_dt_api.register('rows().data()', function () {
  return this.iterator(
    true,
    'rows',
    function (settings, rows) {
      return _pluck_order(settings.aoData, rows, '_aData');
    },
    1
  );
});

_dt_api.registerPlural('rows().cache()', 'row().cache()', function (type) {
  return this.iterator(
    'row',
    function (settings, row) {
      var r = settings.aoData[row];
      return type === 'search' ? r._aFilterData : r._aSortData;
    },
    1
  );
});

_dt_api.registerPlural(
  'rows().invalidate()',
  'row().invalidate()',
  function (src) {
    return this.iterator('row', function (settings, row) {
      _fnInvalidate(settings, row, src);
    });
  }
);

_dt_api.registerPlural('rows().indexes()', 'row().index()', function () {
  return this.iterator(
    'row',
    function (settings, row) {
      return row;
    },
    1
  );
});

_dt_api.registerPlural('rows().ids()', 'row().id()', function (hash) {
  var a = [];
  var context = this.context;

  // `iterator` will drop undefined values, but in this case we want them
  for (var i = 0, ien = context.length; i < ien; i++) {
    for (var j = 0, jen = this[i].length; j < jen; j++) {
      var id = context[i].rowIdFn(context[i].aoData[this[i][j]]._aData);
      a.push((hash === true ? '#' : '') + id);
    }
  }

  return new _dt_api(context, a);
});

_dt_api.registerPlural('rows().remove()', 'row().remove()', function () {
  this.iterator('row', function (settings, row) {
    var data = settings.aoData;
    var rowData = data[row];

    // Delete from the display arrays
    var idx = settings.aiDisplayMaster.indexOf(row);
    if (idx !== -1) {
      settings.aiDisplayMaster.splice(idx, 1);
    }

    // For server-side processing tables - subtract the deleted row from the count
    if (settings._iRecordsDisplay > 0) {
      settings._iRecordsDisplay--;
    }

    // Check for an 'overflow' they case for displaying the table
    _fnLengthOverflow(settings);

    // Remove the row's ID reference if there is one
    var id = settings.rowIdFn(rowData._aData);
    if (id !== undefined) {
      delete settings.aIds[id];
    }

    data[row] = null;
  });

  return this;
});

_dt_api.register('rows.add()', function (rows) {
  var newRows = this.iterator(
    'table',
    function (settings) {
      var row, i, ien;
      var out = [];

      for (i = 0, ien = rows.length; i < ien; i++) {
        row = rows[i];

        if (row.nodeName && row.nodeName.toUpperCase() === 'TR') {
          out.push(_fnAddTr(settings, row)[0]);
        } else {
          out.push(_fnAddData(settings, row));
        }
      }

      return out;
    },
    1
  );

  // Return an Api.rows() extended instance, so rows().nodes() etc can be used
  var modRows = this.rows(-1);
  modRows.pop();
  _fnArrayApply(modRows, newRows);

  return modRows;
});

/**
 *
 */
_dt_api.register('row()', function (selector, opts) {
  return _selector_first(this.rows(selector, opts));
});

_dt_api.register('row().data()', function (data) {
  var ctx = this.context;

  if (data === undefined) {
    // Get
    return ctx.length && this.length && this[0].length
      ? ctx[0].aoData[this[0]]._aData
      : undefined;
  }

  // Set
  var row = ctx[0].aoData[this[0]];
  row._aData = data;

  // If the DOM has an id, and the data source is an array
  if (Array.isArray(data) && row.nTr && row.nTr.id) {
    _fnSetObjectDataFn(ctx[0].rowId)(data, row.nTr.id);
  }

  // Automatically invalidate
  _fnInvalidate(ctx[0], this[0], 'data');

  return this;
});

_dt_api.register('row().node()', function () {
  var ctx = this.context;

  if (ctx.length && this.length && this[0].length) {
    var row = ctx[0].aoData[this[0]];

    if (row && row.nTr) {
      return row.nTr;
    }
  }

  return null;
});

_dt_api.register('row.add()', function (row) {
  // Allow a jQuery object to be passed in - only a single row is added from
  // it though - the first element in the set
  if (row instanceof $ && row.length) {
    row = row[0];
  }

  var rows = this.iterator('table', function (settings) {
    if (row.nodeName && row.nodeName.toUpperCase() === 'TR') {
      return _fnAddTr(settings, row)[0];
    }
    return _fnAddData(settings, row);
  });

  // Return an Api.rows() extended instance, with the newly added row selected
  return this.row(rows[0]);
});

// [[ API.ROW.DETAILS ]]

$(document).on('plugin-init.dt', function (e, context) {
  var api = new _dt_api(context);

  api.on('stateSaveParams.DT', function (e, settings, d) {
    // This could be more compact with the API, but it is a lot faster as a simple
    // internal loop
    var idFn = settings.rowIdFn;
    var rows = settings.aiDisplayMaster;
    var ids = [];

    for (var i = 0; i < rows.length; i++) {
      var rowIdx = rows[i];
      var data = settings.aoData[rowIdx];

      if (data._detailsShow) {
        ids.push('#' + idFn(data._aData));
      }
    }

    d.childRows = ids;
  });

  // For future state loads (e.g. with StateRestore)
  api.on('stateLoaded.DT', function (e, settings, state) {
    __details_state_load(api, state);
  });

  // And the initial load state
  __details_state_load(api, api.state.loaded());
});

var __details_state_load = function (api, state) {
  if (state && state.childRows) {
    api
      .rows(
        state.childRows.map(function (id) {
          // Escape any `:` characters from the row id. Accounts for
          // already escaped characters.
          return id.replace(/([^:\\]*(?:\\.[^:\\]*)*):/g, '$1\\:');
        })
      )
      .every(function () {
        _fnCallbackFire(api.settings()[0], null, 'requestChild', [this]);
      });
  }
};

var __details_add = function (ctx, row, data, klass) {
  // Convert to array of TR elements
  var rows = [];
  var addRow = function (r, k) {
    // Recursion to allow for arrays of jQuery objects
    if (Array.isArray(r) || r instanceof $) {
      for (var i = 0, ien = r.length; i < ien; i++) {
        addRow(r[i], k);
      }
      return;
    }

    // If we get a TR element, then just add it directly - up to the dev
    // to add the correct number of columns etc
    if (r.nodeName && r.nodeName.toLowerCase() === 'tr') {
      r.setAttribute('data-dt-row', row.idx);
      rows.push(r);
    } else {
      // Otherwise create a row with a wrapper
      var created = $('<tr><td></td></tr>')
        .attr('data-dt-row', row.idx)
        .addClass(k);

      $('td', created).addClass(k).html(r)[0].colSpan = _fnVisbleColumns(ctx);

      rows.push(created[0]);
    }
  };

  addRow(data, klass);

  if (row._details) {
    row._details.detach();
  }

  row._details = $(rows);

  // If the children were already shown, that state should be retained
  if (row._detailsShow) {
    row._details.insertAfter(row.nTr);
  }
};

// Make state saving of child row details async to allow them to be batch processed
var __details_state = _dt_util.throttle(function (ctx) {
  _fnSaveState(ctx[0]);
}, 500);

var __details_remove = function (api, idx) {
  var ctx = api.context;

  if (ctx.length) {
    var row = ctx[0].aoData[idx !== undefined ? idx : api[0]];

    if (row && row._details) {
      row._details.remove();

      row._detailsShow = undefined;
      row._details = undefined;
      $(row.nTr).removeClass('dt-hasChild');
      __details_state(ctx);
    }
  }
};

var __details_display = function (api, show) {
  var ctx = api.context;

  if (ctx.length && api.length) {
    var row = ctx[0].aoData[api[0]];

    if (row._details) {
      row._detailsShow = show;

      if (show) {
        row._details.insertAfter(row.nTr);
        $(row.nTr).addClass('dt-hasChild');
      } else {
        row._details.detach();
        $(row.nTr).removeClass('dt-hasChild');
      }

      _fnCallbackFire(ctx[0], null, 'childRow', [show, api.row(api[0])]);

      __details_events(ctx[0]);
      __details_state(ctx);
    }
  }
};

var __details_events = function (settings) {
  var api = new _dt_api(settings);
  var namespace = '.dt.DT_details';
  var drawEvent = 'draw' + namespace;
  var colvisEvent = 'column-sizing' + namespace;
  var destroyEvent = 'destroy' + namespace;
  var data = settings.aoData;

  api.off(drawEvent + ' ' + colvisEvent + ' ' + destroyEvent);

  if (_pluck(data, '_details').length > 0) {
    // On each draw, insert the required elements into the document
    api.on(drawEvent, function (e, ctx) {
      if (settings !== ctx) {
        return;
      }

      api
        .rows({ page: 'current' })
        .eq(0)
        .each(function (idx) {
          // Internal data grab
          var row = data[idx];

          if (row._detailsShow) {
            row._details.insertAfter(row.nTr);
          }
        });
    });

    // Column visibility change - update the colspan
    api.on(colvisEvent, function (e, ctx) {
      if (settings !== ctx) {
        return;
      }

      // Update the colspan for the details rows (note, only if it already has
      // a colspan)
      var row,
        visible = _fnVisbleColumns(ctx);

      for (var i = 0, ien = data.length; i < ien; i++) {
        row = data[i];

        if (row && row._details) {
          row._details.each(function () {
            var el = $(this).children('td');

            if (el.length == 1) {
              el.attr('colspan', visible);
            }
          });
        }
      }
    });

    // Table destroyed - nuke any child rows
    api.on(destroyEvent, function (e, ctx) {
      if (settings !== ctx) {
        return;
      }

      for (var i = 0, ien = data.length; i < ien; i++) {
        if (data[i] && data[i]._details) {
          __details_remove(api, i);
        }
      }
    });
  }
};

// Strings for the method names to help minification
var _emp = '';
var _child_obj = _emp + 'row().child';
var _child_mth = _child_obj + '()';

// data can be:
//  tr
//  string
//  jQuery or array of any of the above
_dt_api.register(_child_mth, function (data, klass) {
  var ctx = this.context;

  if (data === undefined) {
    // get
    return ctx.length && this.length && ctx[0].aoData[this[0]]
      ? ctx[0].aoData[this[0]]._details
      : undefined;
  } else if (data === true) {
    // show
    this.child.show();
  } else if (data === false) {
    // remove
    __details_remove(this);
  } else if (ctx.length && this.length) {
    // set
    __details_add(ctx[0], ctx[0].aoData[this[0]], data, klass);
  }

  return this;
});

_dt_api.register(
  [
    _child_obj + '.show()',
    _child_mth + '.show()', // only when `child()` was called with parameters (without
  ],
  function () {
    // it returns an object and this method is not executed)
    __details_display(this, true);
    return this;
  }
);

_dt_api.register(
  [
    _child_obj + '.hide()',
    _child_mth + '.hide()', // only when `child()` was called with parameters (without
  ],
  function () {
    // it returns an object and this method is not executed)
    __details_display(this, false);
    return this;
  }
);

_dt_api.register(
  [
    _child_obj + '.remove()',
    _child_mth + '.remove()', // only when `child()` was called with parameters (without
  ],
  function () {
    // it returns an object and this method is not executed)
    __details_remove(this);
    return this;
  }
);

_dt_api.register(_child_obj + '.isShown()', function () {
  var ctx = this.context;

  if (ctx.length && this.length && ctx[0].aoData[this[0]]) {
    // _detailsShown as false or undefined will fall through to return false
    return ctx[0].aoData[this[0]]._detailsShow || false;
  }
  return false;
});

// [[ API.COLUMNS ]]

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Columns
 *
 * {integer}           - column index (>=0 count from left, <0 count from right)
 * "{integer}:visIdx"  - visible column index (i.e. translate to column index)  (>=0 count from left, <0 count from right)
 * "{integer}:visible" - alias for {integer}:visIdx  (>=0 count from left, <0 count from right)
 * "{string}:name"     - column name
 * "{string}"          - jQuery selector on column header nodes
 *
 */

// can be an array of these items, comma separated list, or an array of comma
// separated lists

var __re_column_selector = /^([^:]+)?:(name|title|visIdx|visible)$/;

// r1 and r2 are redundant - but it means that the parameters match for the
// iterator callback in columns().data()
var __columnData = function (settings, column, r1, r2, rows, type) {
  var a = [];
  for (var row = 0, ien = rows.length; row < ien; row++) {
    a.push(_fnGetCellData(settings, rows[row], column, type));
  }
  return a;
};

var __column_header = function (settings, column, row) {
  var header = settings.aoHeader;
  var titleRow = settings.titleRow;
  var target = null;

  if (row !== undefined) {
    target = row;
  } else if (titleRow === true) {
    // legacy orderCellsTop support
    target = 0;
  } else if (titleRow === false) {
    target = header.length - 1;
  } else if (titleRow !== null) {
    target = titleRow;
  } else {
    // Automatic - find the _last_ unique cell from the top that is not empty (last for
    // backwards compatibility)
    for (var i = 0; i < header.length; i++) {
      if (
        header[i][column].unique &&
        $('span.dt-column-title', header[i][column].cell).text()
      ) {
        target = i;
      }
    }

    if (target === null) {
      target = 0;
    }
  }

  return header[target][column].cell;
};

var __column_header_cells = function (header) {
  var out = [];

  for (var i = 0; i < header.length; i++) {
    for (var j = 0; j < header[i].length; j++) {
      var cell = header[i][j].cell;

      if (!out.includes(cell)) {
        out.push(cell);
      }
    }
  }

  return out;
};

var __column_selector = function (settings, selector, opts) {
  var columns = settings.aoColumns,
    names,
    titles,
    nodes = __column_header_cells(settings.aoHeader);

  var run = function (s) {
    var selInt = _intVal(s);

    // Selector - all
    if (s === '') {
      return _range(columns.length);
    }

    // Selector - index
    if (selInt !== null) {
      return [
        selInt >= 0
          ? selInt // Count from left
          : columns.length + selInt, // Count from right (+ because its a negative value)
      ];
    }

    // Selector = function
    if (typeof s === 'function') {
      var rows = _selector_row_indexes(settings, opts);

      return columns.map(function (col, idx) {
        return s(
          idx,
          __columnData(settings, idx, 0, 0, rows),
          __column_header(settings, idx)
        )
          ? idx
          : null;
      });
    }

    // jQuery or string selector
    var match = typeof s === 'string' ? s.match(__re_column_selector) : '';

    if (match) {
      switch (match[2]) {
        case 'visIdx':
        case 'visible':
          // Selector is a column index
          if (match[1] && match[1].match(/^\d+$/)) {
            var idx = parseInt(match[1], 10);

            // Visible index given, convert to column index
            if (idx < 0) {
              // Counting from the right
              var visColumns = columns.map(function (col, i) {
                return col.bVisible ? i : null;
              });
              return [visColumns[visColumns.length + idx]];
            }
            // Counting from the left
            return [_fnVisibleToColumnIndex(settings, idx)];
          }

          return columns.map(function (col, idx) {
            // Not visible, can't match
            if (!col.bVisible) {
              return null;
            }

            // Selector
            if (match[1]) {
              return $(nodes[idx]).filter(match[1]).length > 0 ? idx : null;
            }

            // `:visible` on its own
            return idx;
          });

        case 'name':
          // Don't get names, unless needed, and only get once if it is
          if (!names) {
            names = _pluck(columns, 'sName');
          }

          // match by name. `names` is column index complete and in order
          return names.map(function (name, i) {
            return name === match[1] ? i : null;
          });

        case 'title':
          if (!titles) {
            titles = _pluck(columns, 'sTitle');
          }

          // match by column title
          return titles.map(function (title, i) {
            return title === match[1] ? i : null;
          });

        default:
          return [];
      }
    }

    // Cell in the table body
    if (s.nodeName && s._DT_CellIndex) {
      return [s._DT_CellIndex.column];
    }

    // jQuery selector on the TH elements for the columns
    var jqResult = $(nodes)
      .filter(s)
      .map(function () {
        return _fnColumnsFromHeader(this); // `nodes` is column index complete and in order
      })
      .toArray()
      .sort(function (a, b) {
        return a - b;
      });

    if (jqResult.length || !s.nodeName) {
      return jqResult;
    }

    // Otherwise a node which might have a `dt-column` data attribute, or be
    // a child or such an element
    var host = $(s).closest('*[data-dt-column]');
    return host.length ? [host.data('dt-column')] : [];
  };

  var selected = _selector_run('column', selector, run, settings, opts);

  return opts.columnOrder && opts.columnOrder === 'index'
    ? selected.sort(function (a, b) {
        return a - b;
      })
    : selected; // implied
};

var __setColumnVis = function (settings, column, vis) {
  var cols = settings.aoColumns,
    col = cols[column],
    data = settings.aoData,
    cells,
    i,
    ien,
    tr;

  // Get
  if (vis === undefined) {
    return col.bVisible;
  }

  // Set
  // No change
  if (col.bVisible === vis) {
    return false;
  }

  if (vis) {
    // Insert column
    // Need to decide if we should use appendChild or insertBefore
    var insertBefore = _pluck(cols, 'bVisible').indexOf(true, column + 1);

    for (i = 0, ien = data.length; i < ien; i++) {
      if (data[i]) {
        tr = data[i].nTr;
        cells = data[i].anCells;

        if (tr) {
          // insertBefore can act like appendChild if 2nd arg is null
          tr.insertBefore(cells[column], cells[insertBefore] || null);
        }
      }
    }
  } else {
    // Remove column
    $(_pluck(settings.aoData, 'anCells', column)).detach();
  }

  // Common actions
  col.bVisible = vis;

  _colGroup(settings);

  return true;
};

_dt_api.register('columns()', function (selector, opts) {
  // argument shifting
  if (selector === undefined) {
    selector = '';
  } else if ($.isPlainObject(selector)) {
    opts = selector;
    selector = '';
  }

  opts = _selector_opts(opts);

  var inst = this.iterator(
    'table',
    function (settings) {
      return __column_selector(settings, selector, opts);
    },
    1
  );

  // Want argument shifting here and in _row_selector?
  inst.selector.cols = selector;
  inst.selector.opts = opts;

  return inst;
});

_dt_api.registerPlural('columns().header()', 'column().header()', function (row) {
  return this.iterator(
    'column',
    function (settings, column) {
      return __column_header(settings, column, row);
    },
    1
  );
});

_dt_api.registerPlural('columns().footer()', 'column().footer()', function (row) {
  return this.iterator(
    'column',
    function (settings, column) {
      var footer = settings.aoFooter;

      if (!footer.length) {
        return null;
      }

      return settings.aoFooter[row !== undefined ? row : 0][column].cell;
    },
    1
  );
});

_dt_api.registerPlural('columns().data()', 'column().data()', function () {
  return this.iterator('column-rows', __columnData, 1);
});

_dt_api.registerPlural('columns().render()', 'column().render()', function (type) {
  return this.iterator(
    'column-rows',
    function (settings, column, i, j, rows) {
      return __columnData(settings, column, i, j, rows, type);
    },
    1
  );
});

_dt_api.registerPlural('columns().dataSrc()', 'column().dataSrc()', function () {
  return this.iterator(
    'column',
    function (settings, column) {
      return settings.aoColumns[column].mData;
    },
    1
  );
});

_dt_api.registerPlural('columns().cache()', 'column().cache()', function (type) {
  return this.iterator(
    'column-rows',
    function (settings, column, i, j, rows) {
      return _pluck_order(
        settings.aoData,
        rows,
        type === 'search' ? '_aFilterData' : '_aSortData',
        column
      );
    },
    1
  );
});

_dt_api.registerPlural('columns().init()', 'column().init()', function () {
  return this.iterator(
    'column',
    function (settings, column) {
      return settings.aoColumns[column];
    },
    1
  );
});

_dt_api.registerPlural('columns().names()', 'column().name()', function () {
  return this.iterator(
    'column',
    function (settings, column) {
      return settings.aoColumns[column].sName;
    },
    1
  );
});

_dt_api.registerPlural('columns().nodes()', 'column().nodes()', function () {
  return this.iterator(
    'column-rows',
    function (settings, column, i, j, rows) {
      return _pluck_order(settings.aoData, rows, 'anCells', column);
    },
    1
  );
});

_dt_api.registerPlural(
  'columns().titles()',
  'column().title()',
  function (title, row) {
    return this.iterator(
      'column',
      function (settings, column) {
        // Argument shifting
        if (typeof title === 'number') {
          row = title;
          title = undefined;
        }

        var span = $('span.dt-column-title', this.column(column).header(row));

        if (title !== undefined) {
          span.html(title);
          return this;
        }

        return span.html();
      },
      1
    );
  }
);

_dt_api.registerPlural('columns().types()', 'column().type()', function () {
  return this.iterator(
    'column',
    function (settings, column) {
      var type = settings.aoColumns[column].sType;

      // If the type was invalidated, then resolve it. This actually does
      // all columns at the moment. Would only happen once if getting all
      // column's data types.
      if (!type) {
        _fnColumnTypes(settings);
      }

      return type;
    },
    1
  );
});

_dt_api.registerPlural(
  'columns().visible()',
  'column().visible()',
  function (vis, calc) {
    var that = this;
    var changed = [];
    var ret = this.iterator('column', function (settings, column) {
      if (vis === undefined) {
        return settings.aoColumns[column].bVisible;
      } // else

      if (__setColumnVis(settings, column, vis)) {
        changed.push(column);
      }
    });

    // Group the column visibility changes
    if (vis !== undefined) {
      this.iterator('table', function (settings) {
        // Redraw the header after changes
        _fnDrawHead(settings, settings.aoHeader);
        _fnDrawHead(settings, settings.aoFooter);

        // Update colspan for no records display. Child rows and extensions will use their own
        // listeners to do this - only need to update the empty table item here
        if (!settings.aiDisplay.length) {
          $(settings.nTBody)
            .find('td[colspan]')
            .attr('colspan', _fnVisbleColumns(settings));
        }

        _fnSaveState(settings);

        // Second loop once the first is done for events
        that.iterator('column', function (settings, column) {
          if (changed.includes(column)) {
            _fnCallbackFire(settings, null, 'column-visibility', [
              settings,
              column,
              vis,
              calc,
            ]);
          }
        });

        if (changed.length && (calc === undefined || calc)) {
          that.columns.adjust();
        }
      });
    }

    return ret;
  }
);

_dt_api.registerPlural('columns().widths()', 'column().width()', function () {
  // Injects a fake row into the table for just a moment so the widths can
  // be read, regardless of colspan in the header and rows being present in
  // the body
  var columns = this.columns(':visible').count();
  var row = $('<tr>').html('<td>' + Array(columns).join('</td><td>') + '</td>');

  $(this.table().body()).append(row);

  var widths = row.children().map(function () {
    return $(this).outerWidth();
  });

  row.remove();

  return this.iterator(
    'column',
    function (settings, column) {
      var visIdx = _fnColumnIndexToVisible(settings, column);

      return visIdx !== null ? widths[visIdx] : 0;
    },
    1
  );
});

_dt_api.registerPlural('columns().indexes()', 'column().index()', function (type) {
  return this.iterator(
    'column',
    function (settings, column) {
      return type === 'visible'
        ? _fnColumnIndexToVisible(settings, column)
        : column;
    },
    1
  );
});

_dt_api.register('columns.adjust()', function () {
  return this.iterator(
    'table',
    function (settings) {
      // Force a column sizing to happen with a manual call - otherwise it can skip
      // if the size hasn't changed
      settings.containerWidth = -1;

      _fnAdjustColumnSizing(settings);
    },
    1
  );
});

_dt_api.register('column.index()', function (type, idx) {
  if (this.context.length !== 0) {
    var ctx = this.context[0];

    if (type === 'fromVisible' || type === 'toData') {
      return _fnVisibleToColumnIndex(ctx, idx);
    } else if (type === 'fromData' || type === 'toVisible') {
      return _fnColumnIndexToVisible(ctx, idx);
    }
  }
});

_dt_api.register('column()', function (selector, opts) {
  return _selector_first(this.columns(selector, opts));
});

// [[ API.CELLS ]]

var __cell_selector = function (settings, selector, opts) {
  var data = settings.aoData;
  var rows = _selector_row_indexes(settings, opts);
  var cells = _removeEmpty(_pluck_order(data, rows, 'anCells'));
  var allCells = $(_flatten([], cells));
  var row;
  var columns = settings.aoColumns.length;
  var a, i, ien, j, o, host;

  var run = function (s) {
    var fnSelector = typeof s === 'function';

    if (s === null || s === undefined || fnSelector) {
      // All cells and function selectors
      a = [];

      for (i = 0, ien = rows.length; i < ien; i++) {
        row = rows[i];

        for (j = 0; j < columns; j++) {
          o = {
            row: row,
            column: j,
          };

          if (fnSelector) {
            // Selector - function
            host = data[row];

            if (
              s(
                o,
                _fnGetCellData(settings, row, j),
                host.anCells ? host.anCells[j] : null
              )
            ) {
              a.push(o);
            }
          } else {
            // Selector - all
            a.push(o);
          }
        }
      }

      return a;
    }

    // Selector - index
    if ($.isPlainObject(s)) {
      // Valid cell index and its in the array of selectable rows
      return s.column !== undefined &&
        s.row !== undefined &&
        rows.indexOf(s.row) !== -1
        ? [s]
        : [];
    }

    // Selector - jQuery filtered cells
    var jqResult = allCells
      .filter(s)
      .map(function (i, el) {
        return {
          // use a new object, in case someone changes the values
          row: el._DT_CellIndex.row,
          column: el._DT_CellIndex.column,
        };
      })
      .toArray();

    if (jqResult.length || !s.nodeName) {
      return jqResult;
    }

    // Otherwise the selector is a node, and there is one last option - the
    // element might be a child of an element which has dt-row and dt-column
    // data attributes
    host = $(s).closest('*[data-dt-row]');
    return host.length
      ? [
          {
            row: host.data('dt-row'),
            column: host.data('dt-column'),
          },
        ]
      : [];
  };

  return _selector_run('cell', selector, run, settings, opts);
};

_dt_api.register('cells()', function (rowSelector, columnSelector, opts) {
  // Argument shifting
  if ($.isPlainObject(rowSelector)) {
    // Indexes
    if (rowSelector.row === undefined) {
      // Selector options in first parameter
      opts = rowSelector;
      rowSelector = null;
    } else {
      // Cell index objects in first parameter
      opts = columnSelector;
      columnSelector = null;
    }
  }
  if ($.isPlainObject(columnSelector)) {
    opts = columnSelector;
    columnSelector = null;
  }

  // Cell selector
  if (columnSelector === null || columnSelector === undefined) {
    return this.iterator('table', function (settings) {
      return __cell_selector(settings, rowSelector, _selector_opts(opts));
    });
  }

  // The default built in options need to apply to row and columns
  var internalOpts = opts
    ? {
        page: opts.page,
        order: opts.order,
        search: opts.search,
      }
    : {};

  // Row + column selector
  var columns = this.columns(columnSelector, internalOpts);
  var rows = this.rows(rowSelector, internalOpts);
  var i, ien, j, jen;

  var cellsNoOpts = this.iterator(
    'table',
    function (settings, idx) {
      var a = [];

      for (i = 0, ien = rows[idx].length; i < ien; i++) {
        for (j = 0, jen = columns[idx].length; j < jen; j++) {
          a.push({
            row: rows[idx][i],
            column: columns[idx][j],
          });
        }
      }

      return a;
    },
    1
  );

  // There is currently only one extension which uses a cell selector extension
  // It is a _major_ performance drag to run this if it isn't needed, so this is
  // an extension specific check at the moment
  var cells =
    opts && opts.selected ? this.cells(cellsNoOpts, opts) : cellsNoOpts;

  $.extend(cells.selector, {
    cols: columnSelector,
    rows: rowSelector,
    opts: opts,
  });

  return cells;
});

_dt_api.registerPlural('cells().nodes()', 'cell().node()', function () {
  return this.iterator(
    'cell',
    function (settings, row, column) {
      var data = settings.aoData[row];

      return data && data.anCells ? data.anCells[column] : undefined;
    },
    1
  );
});

_dt_api.register('cells().data()', function () {
  return this.iterator(
    'cell',
    function (settings, row, column) {
      return _fnGetCellData(settings, row, column);
    },
    1
  );
});

_dt_api.registerPlural('cells().cache()', 'cell().cache()', function (type) {
  type = type === 'search' ? '_aFilterData' : '_aSortData';

  return this.iterator(
    'cell',
    function (settings, row, column) {
      return settings.aoData[row][type][column];
    },
    1
  );
});

_dt_api.registerPlural('cells().render()', 'cell().render()', function (type) {
  return this.iterator(
    'cell',
    function (settings, row, column) {
      return _fnGetCellData(settings, row, column, type);
    },
    1
  );
});

_dt_api.registerPlural('cells().indexes()', 'cell().index()', function () {
  return this.iterator(
    'cell',
    function (settings, row, column) {
      return {
        row: row,
        column: column,
        columnVisible: _fnColumnIndexToVisible(settings, column),
      };
    },
    1
  );
});

_dt_api.registerPlural(
  'cells().invalidate()',
  'cell().invalidate()',
  function (src) {
    return this.iterator('cell', function (settings, row, column) {
      _fnInvalidate(settings, row, src, column);
    });
  }
);

_dt_api.register('cell()', function (rowSelector, columnSelector, opts) {
  return _selector_first(this.cells(rowSelector, columnSelector, opts));
});

_dt_api.register('cell().data()', function (data) {
  var ctx = this.context;
  var cell = this[0];

  if (data === undefined) {
    // Get
    return ctx.length && cell.length
      ? _fnGetCellData(ctx[0], cell[0].row, cell[0].column)
      : undefined;
  }

  // Set
  _fnSetCellData(ctx[0], cell[0].row, cell[0].column, data);
  _fnInvalidate(ctx[0], cell[0].row, 'data', cell[0].column);

  return this;
});

// [[ API.ORDER ]]

/**
 * Get current ordering (sorting) that has been applied to the table.
 *
 * @returns {array} 2D array containing the sorting information for the first
 *   table in the current context. Each element in the parent array represents
 *   a column being sorted upon (i.e. multi-sorting with two columns would have
 *   2 inner arrays). The inner arrays may have 2 or 3 elements. The first is
 *   the column index that the sorting condition applies to, the second is the
 *   direction of the sort (`desc` or `asc`) and, optionally, the third is the
 *   index of the sorting order from the `column.sorting` initialisation array.
 *//**
 * Set the ordering for the table.
 *
 * @param {integer} order Column index to sort upon.
 * @param {string} direction Direction of the sort to be applied (`asc` or `desc`)
 * @returns {DataTables.Api} this
 *//**
 * Set the ordering for the table.
 *
 * @param {array} order 1D array of sorting information to be applied.
 * @param {array} [...] Optional additional sorting conditions
 * @returns {DataTables.Api} this
 */
/**
 * Set the ordering for the table.
 *
 * @param {array} order 2D array of sorting information to be applied.
 * @returns {DataTables.Api} this
 */
_dt_api.register('order()', function (order, dir) {
  var ctx = this.context;
  var args = Array.prototype.slice.call(arguments);

  if (order === undefined) {
    // get
    return ctx.length !== 0 ? ctx[0].aaSorting : undefined;
  }

  // set
  if (typeof order === 'number') {
    // Simple column / direction passed in
    order = [[order, dir]];
  } else if (args.length > 1) {
    // Arguments passed in (list of 1D arrays)
    order = args;
  }
  // otherwise a 2D array was passed in

  return this.iterator('table', function (settings) {
    var resolved = [];
    _fnSortResolve(settings, resolved, order);

    settings.aaSorting = resolved;
  });
});

/**
 * Attach a sort listener to an element for a given column
 *
 * @param {node|jQuery|string} node Identifier for the element(s) to attach the
 *   listener to. This can take the form of a single DOM node, a jQuery
 *   collection of nodes or a jQuery selector which will identify the node(s).
 * @param {integer} column the column that a click on this node will sort on
 * @param {function} [callback] callback function when sort is run
 * @returns {DataTables.Api} this
 */
_dt_api.register('order.listener()', function (node, column, callback) {
  return this.iterator('table', function (settings) {
    _fnSortAttachListener(settings, node, {}, column, callback);
  });
});

_dt_api.register('order.fixed()', function (set) {
  if (!set) {
    var ctx = this.context;
    var fixed = ctx.length ? ctx[0].aaSortingFixed : undefined;

    return Array.isArray(fixed) ? { pre: fixed } : fixed;
  }

  return this.iterator('table', function (settings) {
    settings.aaSortingFixed = $.extend(true, {}, set);
  });
});

// Order by the selected column(s)
_dt_api.register(['columns().order()', 'column().order()'], function (dir) {
  var that = this;

  if (!dir) {
    return this.iterator(
      'column',
      function (settings, idx) {
        var sort = _fnSortFlatten(settings);

        for (var i = 0, ien = sort.length; i < ien; i++) {
          if (sort[i].col === idx) {
            return sort[i].dir;
          }
        }

        return null;
      },
      1
    );
  } else {
    return this.iterator('table', function (settings, i) {
      settings.aaSorting = that[i].map(function (col) {
        return [col, dir];
      });
    });
  }
});

_dt_api.registerPlural(
  'columns().orderable()',
  'column().orderable()',
  function (directions) {
    return this.iterator(
      'column',
      function (settings, idx) {
        var col = settings.aoColumns[idx];

        return directions ? col.asSorting : col.bSortable;
      },
      1
    );
  }
);

// [[ API.PROCESSING ]]

_dt_api.register('processing()', function (show) {
  return this.iterator('table', function (ctx) {
    _fnProcessingDisplay(ctx, show);
  });
});

// [[ API.SEARCH ]]

_dt_api.register('search()', function (input, regex, smart, caseInsen) {
  var ctx = this.context;

  if (input === undefined) {
    // get
    return ctx.length !== 0 ? ctx[0].oPreviousSearch.search : undefined;
  }

  // set
  return this.iterator('table', function (settings) {
    if (!settings.oFeatures.bFilter) {
      return;
    }

    if (typeof regex === 'object') {
      // New style options to pass to the search builder
      _fnFilterComplete(
        settings,
        $.extend(settings.oPreviousSearch, regex, {
          search: input,
        })
      );
    } else {
      // Compat for the old options
      _fnFilterComplete(
        settings,
        $.extend(settings.oPreviousSearch, {
          search: input,
          regex: regex === null ? false : regex,
          smart: smart === null ? true : smart,
          caseInsensitive: caseInsen === null ? true : caseInsen,
        })
      );
    }
  });
});

_dt_api.register('search.fixed()', function (name, search) {
  var ret = this.iterator(true, 'table', function (settings) {
    var fixed = settings.searchFixed;

    if (!name) {
      return Object.keys(fixed);
    } else if (search === undefined) {
      return fixed[name];
    } else if (search === null) {
      delete fixed[name];
    } else {
      fixed[name] = search;
    }

    return this;
  });

  return name !== undefined && search === undefined ? ret[0] : ret;
});

_dt_api.registerPlural(
  'columns().search()',
  'column().search()',
  function (input, regex, smart, caseInsen) {
    return this.iterator('column', function (settings, column) {
      var preSearch = settings.aoPreSearchCols;

      if (input === undefined) {
        // get
        return preSearch[column].search;
      }

      // set
      if (!settings.oFeatures.bFilter) {
        return;
      }

      if (typeof regex === 'object') {
        // New style options to pass to the search builder
        $.extend(preSearch[column], regex, {
          search: input,
        });
      } else {
        // Old style (with not all options available)
        $.extend(preSearch[column], {
          search: input,
          regex: regex === null ? false : regex,
          smart: smart === null ? true : smart,
          caseInsensitive: caseInsen === null ? true : caseInsen,
        });
      }

      _fnFilterComplete(settings, settings.oPreviousSearch);
    });
  }
);

_dt_api.register(
  ['columns().search.fixed()', 'column().search.fixed()'],
  function (name, search) {
    var ret = this.iterator(true, 'column', function (settings, colIdx) {
      var fixed = settings.aoColumns[colIdx].searchFixed;

      if (!name) {
        return Object.keys(fixed);
      } else if (search === undefined) {
        return fixed[name] || null;
      } else if (search === null) {
        delete fixed[name];
      } else {
        fixed[name] = search;
      }

      return this;
    });

    return name !== undefined && search === undefined ? ret[0] : ret;
  }
);

// [[ API.STATE ]]

/*
 * State API methods
 */

_dt_api.register('state()', function (set, ignoreTime) {
  // getter
  if (!set) {
    return this.context.length ? this.context[0].oSavedState : null;
  }

  var setMutate = $.extend(true, {}, set);

  // setter
  return this.iterator('table', function (settings) {
    if (ignoreTime !== false) {
      setMutate.time = +new Date() + 100;
    }

    _fnImplementState(settings, setMutate, function () {});
  });
});

_dt_api.register('state.clear()', function () {
  return this.iterator('table', function (settings) {
    // Save an empty object
    settings.fnStateSaveCallback.call(settings.oInstance, settings, {});
  });
});

_dt_api.register('state.loaded()', function () {
  return this.context.length ? this.context[0].oLoadedState : null;
});

_dt_api.register('state.save()', function () {
  return this.iterator('table', function (settings) {
    _fnSaveState(settings);
  });
});

// [[ API.CORE ]]

/**
 *
 */
_dt_api.register('$()', function (selector, opts) {
  var rows = this.rows(opts).nodes(), // Get all rows
    jqRows = $(rows);

  return $(
    [].concat(
      jqRows.filter(selector).toArray(),
      jqRows.find(selector).toArray()
    )
  );
});

// jQuery functions to operate on the tables
$.each(['on', 'one', 'off'], function (i, key) {
  _dt_api.register(key + '()', function (/* event, handler */) {
    var args = Array.prototype.slice.call(arguments);

    // Add the `dt` namespace automatically if it isn't already present
    args[0] = args[0]
      .split(/\s/)
      .map(function (e) {
        return !e.match(/\.dt\b/) ? e + '.dt' : e;
      })
      .join(' ');

    var inst = $(this.tables().nodes());
    inst[key].apply(inst, args);
    return this;
  });
});

_dt_api.register('clear()', function () {
  return this.iterator('table', function (settings) {
    _fnClearTable(settings);
  });
});

_dt_api.register('error()', function (msg) {
  return this.iterator('table', function (settings) {
    _fnLog(settings, 0, msg);
  });
});

_dt_api.register('settings()', function () {
  return new _dt_api(this.context, this.context);
});

_dt_api.register('init()', function () {
  var ctx = this.context;
  return ctx.length ? ctx[0].oInit : null;
});

_dt_api.register('data()', function () {
  return this.iterator('table', function (settings) {
    return _pluck(settings.aoData, '_aData');
  }).flatten();
});

_dt_api.register('trigger()', function (name, args, bubbles) {
  return this.iterator('table', function (settings) {
    return _fnCallbackFire(settings, null, name, args, bubbles);
  }).flatten();
});

_dt_api.register('ready()', function (fn) {
  var ctx = this.context;

  // Get status of first table
  if (!fn) {
    return ctx.length ? ctx[0]._bInitComplete || false : null;
  }

  // Function to run either once the table becomes ready or
  // immediately if it is already ready.
  return this.tables().every(function () {
    var api = this;

    if (this.context[0]._bInitComplete) {
      fn.call(api);
    } else {
      this.on('init.dt.DT', function () {
        fn.call(api);
      });
    }
  });
});

_dt_api.register('destroy()', function (remove) {
  remove = remove || false;

  return this.iterator('table', function (settings) {
    var classes = settings.oClasses;
    var table = settings.nTable;
    var tbody = settings.nTBody;
    var thead = settings.nTHead;
    var tfoot = settings.nTFoot;
    var jqTable = $(table);
    var jqTbody = $(tbody);
    var jqWrapper = $(settings.nTableWrapper);
    var rows = settings.aoData.map(function (r) {
      return r ? r.nTr : null;
    });
    var orderClasses = classes.order;

    // Flag to note that the table is currently being destroyed - no action
    // should be taken
    settings.bDestroying = true;

    // Fire off the destroy callbacks for plug-ins etc
    _fnCallbackFire(settings, 'aoDestroyCallback', 'destroy', [settings], true);

    // If not being removed from the document, make all columns visible
    if (!remove) {
      new _dt_api(settings).columns().visible(true);
    }

    // Container width change listener
    if (settings.resizeObserver) {
      settings.resizeObserver.disconnect();
    }

    // Blitz all `DT` namespaced events (these are internal events, the
    // lowercase, `dt` events are user subscribed and they are responsible
    // for removing them
    jqWrapper.off('.DT').find(':not(tbody *)').off('.DT');
    $(window).off('.DT-' + settings.sInstance);

    // When scrolling we had to break the table up - restore it
    if (table != thead.parentNode) {
      jqTable.children('thead').detach();
      jqTable.append(thead);
    }

    if (tfoot && table != tfoot.parentNode) {
      jqTable.children('tfoot').detach();
      jqTable.append(tfoot);
    }

    // Clean up the header / footer
    cleanHeader(thead, 'header');
    cleanHeader(tfoot, 'footer');
    settings.colgroup.remove();

    settings.aaSorting = [];
    settings.aaSortingFixed = [];
    _fnSortingClasses(settings);

    $(jqTable)
      .find('th, td')
      .removeClass(
        $.map(_dt_ext_types.className, function (v) {
          return v;
        }).join(' ')
      );

    $('th, td', thead)
      .removeClass(
        orderClasses.none +
          ' ' +
          orderClasses.canAsc +
          ' ' +
          orderClasses.canDesc +
          ' ' +
          orderClasses.isAsc +
          ' ' +
          orderClasses.isDesc
      )
      .css('width', '')
      .removeAttr('aria-sort');

    // Add the TR elements back into the table in their original order
    jqTbody.children().detach();
    jqTbody.append(rows);

    var orig = settings.nTableWrapper.parentNode;
    var insertBefore = settings.nTableWrapper.nextSibling;

    // Remove the DataTables generated nodes, events and classes
    var removedMethod = remove ? 'remove' : 'detach';
    jqTable[removedMethod]();
    jqWrapper[removedMethod]();

    // If we need to reattach the table to the document
    if (!remove && orig) {
      // insertBefore acts like appendChild if !arg[1]
      orig.insertBefore(table, insertBefore);

      // Restore the width of the original table - was read from the style property,
      // so we can restore directly to that
      jqTable.css('width', settings.sDestroyWidth).removeClass(classes.table);
    }

    /* Remove the settings object from the settings array */
    var idx = _dt_settings.indexOf(settings);
    if (idx !== -1) {
      _dt_settings.splice(idx, 1);
    }
  });
});

// Add the `every()` method for rows, columns and cells in a compact form
$.each(['column', 'row', 'cell'], function (i, type) {
  _dt_api.register(type + 's().every()', function (fn) {
    var opts = this.selector.opts;
    var api = this;
    var inst;
    var counter = 0;

    return this.iterator('every', function (settings, selectedIdx, tableIdx) {
      inst = api[type](selectedIdx, opts);

      if (type === 'cell') {
        fn.call(inst, inst[0][0].row, inst[0][0].column, tableIdx, counter);
      } else {
        fn.call(inst, selectedIdx, tableIdx, counter);
      }

      counter++;
    });
  });
});

// i18n method for extensions to be able to use the language object from the
// DataTable
_dt_api.register('i18n()', function (token, def, plural) {
  var ctx = this.context[0];
  var resolved = _fnGetObjectDataFn(token)(ctx.oLanguage);

  if (resolved === undefined) {
    resolved = def;
  }

  if ($.isPlainObject(resolved)) {
    resolved =
      plural !== undefined && resolved[plural] !== undefined
        ? resolved[plural]
        : plural === false
          ? resolved
          : resolved._;
  }

  return typeof resolved === 'string'
    ? resolved.replace('%d', plural) // nb: plural might be undefined,
    : resolved;
});

// Needed for header and footer, so pulled into its own function
function cleanHeader(node, className) {
  $(node).find('span.dt-column-order').remove();
  $(node)
    .find('span.dt-column-title')
    .each(function () {
      var title = $(this).html();
      $(this).parent().parent().append(title);
      $(this).remove();
    });
  $(node)
    .find('div.dt-column-' + className)
    .remove();

  $('th, td', node).removeAttr('data-dt-column');
}

export default _dt_api;
