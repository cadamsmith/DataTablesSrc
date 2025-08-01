import { _dt_util } from '../api/api.util';
import { _dt_models_row } from '../model/model.row';
import { _fnCallbackFire, _fnLog } from './core.support';
import { _addClass, _pluck, _unique } from './core.internal';
import { _extend, _isPlainObject } from './core.jq';
import $ from 'jquery';
import { _dt_ext_types } from '../ext/ext.types';

/**
 * Return a function that can be used to get data from a source object, taking
 * into account the ability to use nested objects as a source
 *  @param {string|int|function} mSource The data source for the object
 *  @returns {function} Data get function
 *  @memberof DataTable#oApi
 */
export var _fnGetObjectDataFn = _dt_util.get;

/**
 * Return a function that can be used to set data from a source object, taking
 * into account the ability to use nested objects as a source
 *  @param {string|int|function} mSource The data source for the object
 *  @returns {function} Data set function
 *  @memberof DataTable#oApi
 */
export var _fnSetObjectDataFn = _dt_util.set;

/**
 * Get the data for a given cell from the internal cache, taking into account data mapping
 *  @param {object} settings dataTables settings object
 *  @param {int} rowIdx aoData row id
 *  @param {int} colIdx Column index
 *  @param {string} type data get type ('display', 'type' 'filter|search' 'sort|order')
 *  @returns {*} Cell data
 *  @memberof DataTable#oApi
 */
export function _fnGetCellData(settings, rowIdx, colIdx, type) {
  if (type === 'search') {
    type = 'filter';
  } else if (type === 'order') {
    type = 'sort';
  }

  var row = settings.aoData[rowIdx];

  if (!row) {
    return undefined;
  }

  var draw = settings.iDraw;
  var col = settings.aoColumns[colIdx];
  var rowData = row._aData;
  var defaultContent = col.sDefaultContent;
  var cellData = col.fnGetData(rowData, type, {
    settings: settings,
    row: rowIdx,
    col: colIdx,
  });

  // Allow for a node being returned for non-display types
  if (
    type !== 'display' &&
    cellData &&
    typeof cellData === 'object' &&
    cellData.nodeName
  ) {
    cellData = cellData.innerHTML;
  }

  if (cellData === undefined) {
    if (settings.iDrawError != draw && defaultContent === null) {
      _fnLog(
        settings,
        0,
        'Requested unknown parameter ' +
          (typeof col.mData == 'function'
            ? '{function}'
            : "'" + col.mData + "'") +
          ' for row ' +
          rowIdx +
          ', column ' +
          colIdx,
        4
      );
      settings.iDrawError = draw;
    }
    return defaultContent;
  }

  // When the data source is null and a specific data type is requested (i.e.
  // not the original data), we can use default column data
  if (
    (cellData === rowData || cellData === null) &&
    defaultContent !== null &&
    type !== undefined
  ) {
    cellData = defaultContent;
  } else if (typeof cellData === 'function') {
    // If the data source is a function, then we run it and use the return,
    // executing in the scope of the data object (for instances)
    return cellData.call(rowData);
  }

  if (cellData === null && type === 'display') {
    return '';
  }

  if (type === 'filter') {
    var fomatters = _dt_ext_types.search;

    if (fomatters[col.sType]) {
      cellData = fomatters[col.sType](cellData);
    }
  }

  return cellData;
}

/**
 * Write a value to a cell
 * @param {*} td Cell
 * @param {*} val Value
 */
export function _fnWriteCell(td, val) {
  if (val && typeof val === 'object' && val.nodeName) {
    $(td).empty().append(val);
  } else {
    td.innerHTML = val;
  }
}

/**
 * Add a data array to the table, creating DOM node etc. This is the parallel to
 * _fnGatherData, but for adding rows from a Javascript source, rather than a
 * DOM source.
 *  @param {object} settings dataTables settings object
 *  @param {array} data data array to be added
 *  @param {node} [tr] TR element to add to the table - optional. If not given,
 *    DataTables will create a row automatically
 *  @param {array} [tds] Array of TD|TH elements for the row - must be given
 *    if nTr is.
 *  @returns {int} >=0 if successful (index of new aoData entry), -1 if failed
 *  @memberof DataTable#oApi
 */
export function _fnAddData(settings, dataIn, tr, tds) {
  /* Create the object for storing information about this new row */
  var rowIdx = settings.aoData.length;
  var rowModel = _extend(true, {}, _dt_models_row, {
    src: tr ? 'dom' : 'data',
    idx: rowIdx,
  });

  rowModel._aData = dataIn;
  settings.aoData.push(rowModel);

  var columns = settings.aoColumns;

  for (var i = 0, iLen = columns.length; i < iLen; i++) {
    // Invalidate the column types as the new data needs to be revalidated
    columns[i].sType = null;
  }

  /* Add to the display array */
  settings.aiDisplayMaster.push(rowIdx);

  var id = settings.rowIdFn(dataIn);
  if (id !== undefined) {
    settings.aIds[id] = rowModel;
  }

  /* Create the DOM information, or register it if already present */
  if (tr || !settings.oFeatures.bDeferRender) {
    _fnCreateTr(settings, rowIdx, tr, tds);
  }

  return rowIdx;
}

/**
 * Add one or more TR elements to the table. Generally we'd expect to
 * use this for reading data from a DOM sourced table, but it could be
 * used for an TR element. Note that if a TR is given, it is used (i.e.
 * it is not cloned).
 *  @param {object} settings dataTables settings object
 *  @param {array|node|jQuery} trs The TR element(s) to add to the table
 *  @returns {array} Array of indexes for the added rows
 *  @memberof DataTable#oApi
 */
export function _fnAddTr(settings, trs) {
  var row;

  // Allow an individual node to be passed in
  if (!(trs instanceof $)) {
    trs = $(trs);
  }

  return trs.map(function (i, el) {
    row = _fnGetRowElements(settings, el);
    return _fnAddData(settings, row.data, el, row.cells);
  });
}

/**
 * Set the value for a specific cell, into the internal data cache
 *  @param {object} settings dataTables settings object
 *  @param {int} rowIdx aoData row id
 *  @param {int} colIdx Column index
 *  @param {*} val Value to set
 *  @memberof DataTable#oApi
 */
export function _fnSetCellData(settings, rowIdx, colIdx, val) {
  var col = settings.aoColumns[colIdx];
  var rowData = settings.aoData[rowIdx]._aData;

  col.fnSetData(rowData, val, {
    settings: settings,
    row: rowIdx,
    col: colIdx,
  });
}

/**
 * Return an array with the full table data
 *  @param {object} oSettings dataTables settings object
 *  @returns array {array} aData Master data array
 *  @memberof DataTable#oApi
 */
export function _fnGetDataMaster(settings) {
  return _pluck(settings.aoData, '_aData');
}

/**
 * Nuke the table
 *  @param {object} oSettings dataTables settings object
 *  @memberof DataTable#oApi
 */
export function _fnClearTable(settings) {
  settings.aoData.length = 0;
  settings.aiDisplayMaster.length = 0;
  settings.aiDisplay.length = 0;
  settings.aIds = {};
}

/**
 * Mark cached data as invalid such that a re-read of the data will occur when
 * the cached data is next requested. Also update from the data source object.
 *
 * @param {object} settings DataTables settings object
 * @param {int}    rowIdx   Row index to invalidate
 * @param {string} [src]    Source to invalidate from: undefined, 'auto', 'dom'
 *     or 'data'
 * @param {int}    [colIdx] Column index to invalidate. If undefined the whole
 *     row will be invalidated
 * @memberof DataTable#oApi
 *
 * @todo For the modularisation of v1.11 this will need to become a callback, so
 *   the sort and filter methods can subscribe to it. That will required
 *   initialisation options for sorting, which is why it is not already baked in
 */
export function _fnInvalidate(settings, rowIdx, src, colIdx) {
  var row = settings.aoData[rowIdx];
  var i, ien;

  // Remove the cached data for the row
  row._aSortData = null;
  row._aFilterData = null;
  row.displayData = null;

  // Are we reading last data from DOM or the data object?
  if (src === 'dom' || ((!src || src === 'auto') && row.src === 'dom')) {
    // Read the data from the DOM
    row._aData = _fnGetRowElements(
      settings,
      row,
      colIdx,
      colIdx === undefined ? undefined : row._aData
    ).data;
  } else {
    // Reading from data object, update the DOM
    var cells = row.anCells;
    var display = _fnGetRowDisplay(settings, rowIdx);

    if (cells) {
      if (colIdx !== undefined) {
        _fnWriteCell(cells[colIdx], display[colIdx]);
      } else {
        for (i = 0, ien = cells.length; i < ien; i++) {
          _fnWriteCell(cells[i], display[i]);
        }
      }
    }
  }

  // Column specific invalidation
  var cols = settings.aoColumns;
  if (colIdx !== undefined) {
    // Type - the data might have changed
    cols[colIdx].sType = null;

    // Max length string. Its a fairly cheep recalculation, so not worth
    // something more complicated
    cols[colIdx].maxLenString = null;
  } else {
    for (i = 0, ien = cols.length; i < ien; i++) {
      cols[i].sType = null;
      cols[i].maxLenString = null;
    }

    // Update DataTables special `DT_*` attributes for the row
    _fnRowAttributes(settings, row);
  }
}

/**
 * Build a data source object from an HTML row, reading the contents of the
 * cells that are in the row.
 *
 * @param {object} settings DataTables settings object
 * @param {node|object} TR element from which to read data or existing row
 *   object from which to re-read the data from the cells
 * @param {int} [colIdx] Optional column index
 * @param {array|object} [d] Data source object. If `colIdx` is given then this
 *   parameter should also be given and will be used to write the data into.
 *   Only the column in question will be written
 * @returns {object} Object with two parameters: `data` the data read, in
 *   document order, and `cells` and array of nodes (they can be useful to the
 *   caller, so rather than needing a second traversal to get them, just return
 *   them from here).
 * @memberof DataTable#oApi
 */
function _fnGetRowElements(settings, row, colIdx, d) {
  var tds = [],
    td = row.firstChild,
    name,
    col,
    i = 0,
    contents,
    columns = settings.aoColumns,
    objectRead = settings._rowReadObject;

  // Allow the data object to be passed in, or construct
  d = d !== undefined ? d : objectRead ? {} : [];

  var attr = function (str, td) {
    if (typeof str === 'string') {
      var idx = str.indexOf('@');

      if (idx !== -1) {
        var attr = str.substring(idx + 1);
        var setter = _fnSetObjectDataFn(str);
        setter(d, td.getAttribute(attr));
      }
    }
  };

  // Read data from a cell and store into the data object
  var cellProcess = function (cell) {
    if (colIdx === undefined || colIdx === i) {
      col = columns[i];
      contents = cell.innerHTML.trim();

      if (col && col._bAttrSrc) {
        var setter = _fnSetObjectDataFn(col.mData._);
        setter(d, contents);

        attr(col.mData.sort, cell);
        attr(col.mData.type, cell);
        attr(col.mData.filter, cell);
      } else {
        // Depending on the `data` option for the columns the data can
        // be read to either an object or an array.
        if (objectRead) {
          if (!col._setter) {
            // Cache the setter function
            col._setter = _fnSetObjectDataFn(col.mData);
          }
          col._setter(d, contents);
        } else {
          d[i] = contents;
        }
      }
    }

    i++;
  };

  if (td) {
    // `tr` element was passed in
    while (td) {
      name = td.nodeName.toUpperCase();

      if (name == 'TD' || name == 'TH') {
        cellProcess(td);
        tds.push(td);
      }

      td = td.nextSibling;
    }
  } else {
    // Existing row object passed in
    tds = row.anCells;

    for (var j = 0, jen = tds.length; j < jen; j++) {
      cellProcess(tds[j]);
    }
  }

  // Read the ID from the DOM if present
  var rowNode = row.firstChild ? row : row.nTr;

  if (rowNode) {
    var id = rowNode.getAttribute('id');

    if (id) {
      _fnSetObjectDataFn(settings.rowId)(d, id);
    }
  }

  return {
    data: d,
    cells: tds,
  };
}

/**
 * Create a new TR element (and it's TD children) for a row
 *  @param {object} oSettings dataTables settings object
 *  @param {int} iRow Row to consider
 *  @param {node} [nTrIn] TR element to add to the table - optional. If not given,
 *    DataTables will create a row automatically
 *  @param {array} [anTds] Array of TD|TH elements for the row - must be given
 *    if nTr is.
 *  @memberof DataTable#oApi
 */
export function _fnCreateTr(oSettings, iRow, nTrIn, anTds) {
  var row = oSettings.aoData[iRow],
    rowData = row._aData,
    cells = [],
    nTr,
    nTd,
    oCol,
    i,
    iLen,
    create,
    trClass = oSettings.oClasses.tbody.row;

  if (row.nTr === null) {
    nTr = nTrIn || document.createElement('tr');

    row.nTr = nTr;
    row.anCells = cells;

    _addClass(nTr, trClass);

    /* Use a private property on the node to allow reserve mapping from the node
     * to the aoData array for fast look up
     */
    nTr._DT_RowIndex = iRow;

    /* Special parameters can be given by the data source to be used on the row */
    _fnRowAttributes(oSettings, row);

    /* Process each column */
    for (i = 0, iLen = oSettings.aoColumns.length; i < iLen; i++) {
      oCol = oSettings.aoColumns[i];
      create = nTrIn && anTds[i] ? false : true;

      nTd = create ? document.createElement(oCol.sCellType) : anTds[i];

      if (!nTd) {
        _fnLog(oSettings, 0, 'Incorrect column count', 18);
      }

      nTd._DT_CellIndex = {
        row: iRow,
        column: i,
      };

      cells.push(nTd);

      var display = _fnGetRowDisplay(oSettings, iRow);

      // Need to create the HTML if new, or if a rendering function is defined
      if (
        create ||
        ((oCol.mRender || oCol.mData !== i) &&
          (!_isPlainObject(oCol.mData) || oCol.mData._ !== i + '.display'))
      ) {
        _fnWriteCell(nTd, display[i]);
      }

      // column class
      _addClass(nTd, oCol.sClass);

      // Visibility - add or remove as required
      if (oCol.bVisible && create) {
        nTr.appendChild(nTd);
      } else if (!oCol.bVisible && !create) {
        nTd.parentNode.removeChild(nTd);
      }

      if (oCol.fnCreatedCell) {
        oCol.fnCreatedCell.call(
          oSettings.oInstance,
          nTd,
          _fnGetCellData(oSettings, iRow, i),
          rowData,
          iRow,
          i
        );
      }
    }

    _fnCallbackFire(oSettings, 'aoRowCreatedCallback', 'row-created', [
      nTr,
      rowData,
      iRow,
      cells,
    ]);
  } else {
    _addClass(row.nTr, trClass);
  }
}

/**
 * Add attributes to a row based on the special `DT_*` parameters in a data
 * source object.
 *  @param {object} settings DataTables settings object
 *  @param {object} DataTables row object for the row to be modified
 *  @memberof DataTable#oApi
 */
function _fnRowAttributes(settings, row) {
  var tr = row.nTr;
  var data = row._aData;

  if (tr) {
    var id = settings.rowIdFn(data);

    if (id) {
      tr.id = id;
    }

    if (data.DT_RowClass) {
      // Remove any classes added by DT_RowClass before
      var a = data.DT_RowClass.split(' ');
      row.__rowc = row.__rowc ? _unique(row.__rowc.concat(a)) : a;

      $(tr).removeClass(row.__rowc.join(' ')).addClass(data.DT_RowClass);
    }

    if (data.DT_RowAttr) {
      $(tr).attr(data.DT_RowAttr);
    }

    if (data.DT_RowData) {
      $(tr).data(data.DT_RowData);
    }
  }
}

/**
 * Render and cache a row's display data for the columns, if required
 * @returns
 */
export function _fnGetRowDisplay(settings, rowIdx) {
  var rowModal = settings.aoData[rowIdx];
  var columns = settings.aoColumns;

  if (!rowModal.displayData) {
    // Need to render and cache
    rowModal.displayData = [];

    for (var colIdx = 0, len = columns.length; colIdx < len; colIdx++) {
      rowModal.displayData.push(
        _fnGetCellData(settings, rowIdx, colIdx, 'display')
      );
    }
  }

  return rowModal.displayData;
}
