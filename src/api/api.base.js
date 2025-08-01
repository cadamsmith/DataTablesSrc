import { _pluck, _range, _unique } from '../core/core.internal';
import { _extend, _isPlainObject } from '../core/core.jq';
import { _fnArrayApply, _fnDataSource } from '../core/core.support';
import { _registerApis_ajax } from './api.ajax';
import { _registerApis_cells } from './api.cells';
import { _registerApis_columns } from './api.columns';
import { _registerApis_draw } from './api.draw';
import { _registerApis_order } from './api.order';
import { _registerApis_page } from './api.page';
import { _registerApis_processing } from './api.processing';
import { _registerApis_rowDetails } from './api.row.details';
import { _registerApis_rows } from './api.rows';
import { _registerApis_search } from './api.search';
import { _registerApis_state } from './api.state';
import { _dt_settings } from './api.settings';
import { _registerApis_table } from './api.table';
import { _registerApis_core } from './api.core';
import { _dt_util } from './api.util';
import $ from 'jquery';
import { _dt_ext_selector } from '../ext/ext.selector';
import { _fnSort } from '../core/core.sort';

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
_extend(_dt_api.prototype, {
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
          rows = _dt_api._selector_row_indexes(context[i], selector.opts);
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
          : _isPlainObject(val)
            ? 'object'
            : 'other';
    } else {
      struct = method ? src.methodExt : src.propExt;
    }
  }
};

_dt_api.registerPlural = function (pluralName, singularName, val) {
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

// SELECTORS
_dt_api._selector_run = function (type, selector, selectFn, settings, opts) {
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

_dt_api._selector_opts = function (opts) {
  if (!opts) {
    opts = {};
  }

  // Backwards compatibility for 1.9- which used the terminology filter rather
  // than search
  if (opts.filter && opts.search === undefined) {
    opts.search = opts.filter;
  }

  return _extend(
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
_dt_api._selector_first = function (old) {
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

_dt_api._selector_row_indexes = function (settings, opts) {
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

export function _registerBuiltInApis() {
  var register = _dt_api.register;
  var registerPlural = _dt_api.registerPlural;

  var constructNewApi = (context, data) => new _dt_api(context, data);

  const selectorFns = {
    opts: _dt_api._selector_opts,
    run: _dt_api._selector_run,
    first: _dt_api._selector_first,
    row_indexes: _dt_api._selector_row_indexes,
  };

  _registerApis_table(register, registerPlural, constructNewApi, selectorFns);
  _registerApis_draw(register, registerPlural, constructNewApi, selectorFns);
  _registerApis_page(register, registerPlural, constructNewApi, selectorFns);
  _registerApis_ajax(register, registerPlural, constructNewApi, selectorFns);
  _registerApis_rows(register, registerPlural, constructNewApi, selectorFns);
  _registerApis_rowDetails(
    register,
    registerPlural,
    constructNewApi,
    selectorFns
  );
  _registerApis_columns(register, registerPlural, constructNewApi, selectorFns);
  _registerApis_cells(register, registerPlural, constructNewApi, selectorFns);
  _registerApis_order(register, registerPlural, constructNewApi, selectorFns);
  _registerApis_processing(
    register,
    registerPlural,
    constructNewApi,
    selectorFns
  );
  _registerApis_search(register, registerPlural, constructNewApi, selectorFns);
  _registerApis_state(register, registerPlural, constructNewApi, selectorFns);
  _registerApis_core(register, registerPlural, constructNewApi, selectorFns);
}

export { _dt_api };
