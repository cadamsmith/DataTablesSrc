import { _pluck } from "./core.internal";
import { _fnColumnTypes, _fnColumnIndexToVisible, _fnColumnsFromHeader } from "./core.columns";
import { _fnDataSource, _fnCallbackFire, _fnBindAction } from "./core.support";
import { _fnGetCellData } from "./core.data";
import { _fnReDraw } from "./core.draw";
import { _fnProcessingRun } from "./core.processing";
import { $ } from "jquery";
import { _dt_ext_types } from "../ext/ext.types";
import { _dt_ext_order } from "../ext/ext.order";
import { _fnSortFlatten, _fnSortResolve } from "./core.sortAlgo";

/**
 * Change the order of the table
 *  @param {object} oSettings dataTables settings object
 *  @memberof DataTable#oApi
 */
export function _fnSort(oSettings, col, dir) {
  var i,
    ien,
    iLen,
    aiOrig = [],
    extSort = _dt_ext_types.order,
    aoData = oSettings.aoData,
    sortCol,
    displayMaster = oSettings.aiDisplayMaster,
    aSort;

  // Make sure the columns all have types defined
  _fnColumnTypes(oSettings);

  // Allow a specific column to be sorted, which will _not_ alter the display
  // master
  if (col !== undefined) {
    var srcCol = oSettings.aoColumns[col];

    aSort = [
      {
        src: col,
        col: col,
        dir: dir,
        index: 0,
        type: srcCol.sType,
        formatter: extSort[srcCol.sType + "-pre"],
        sorter: extSort[srcCol.sType + "-" + dir],
      },
    ];
    displayMaster = displayMaster.slice();
  } else {
    aSort = _fnSortFlatten(oSettings);
  }

  for (i = 0, ien = aSort.length; i < ien; i++) {
    sortCol = aSort[i];

    // Load the data needed for the sort, for each cell
    _fnSortData(oSettings, sortCol.col);
  }

  /* No sorting required if server-side or no sorting array */
  if (_fnDataSource(oSettings) != "ssp" && aSort.length !== 0) {
    // Reset the initial positions on each pass so we get a stable sort
    for (i = 0, iLen = displayMaster.length; i < iLen; i++) {
      aiOrig[i] = i;
    }

    // If the first sort is desc, then reverse the array to preserve original
    // order, just in reverse
    if (aSort.length && aSort[0].dir === "desc" && oSettings.orderDescReverse) {
      aiOrig.reverse();
    }

    /* Do the sort - here we want multi-column sorting based on a given data source (column)
     * and sorting function (from oSort) in a certain direction. It's reasonably complex to
     * follow on it's own, but this is what we want (example two column sorting):
     *  fnLocalSorting = function(a,b){
     *    var test;
     *    test = oSort['string-asc']('data11', 'data12');
     *      if (test !== 0)
     *        return test;
     *    test = oSort['numeric-desc']('data21', 'data22');
     *    if (test !== 0)
     *      return test;
     *    return oSort['numeric-asc']( aiOrig[a], aiOrig[b] );
     *  }
     * Basically we have a test for each sorting column, if the data in that column is equal,
     * test the next column. If all columns match, then we use a numeric sort on the row
     * positions in the original data array to provide a stable sort.
     */
    displayMaster.sort(function (a, b) {
      var x,
        y,
        k,
        test,
        sort,
        len = aSort.length,
        dataA = aoData[a]._aSortData,
        dataB = aoData[b]._aSortData;

      for (k = 0; k < len; k++) {
        sort = aSort[k];

        // Data, which may have already been through a `-pre` function
        x = dataA[sort.col];
        y = dataB[sort.col];

        if (sort.sorter) {
          // If there is a custom sorter (`-asc` or `-desc`) for this
          // data type, use it
          test = sort.sorter(x, y);

          if (test !== 0) {
            return test;
          }
        } else {
          // Otherwise, use generic sorting
          test = x < y ? -1 : x > y ? 1 : 0;

          if (test !== 0) {
            return sort.dir === "asc" ? test : -test;
          }
        }
      }

      x = aiOrig[a];
      y = aiOrig[b];

      return x < y ? -1 : x > y ? 1 : 0;
    });
  } else if (aSort.length === 0) {
    // Apply index order
    displayMaster.sort(function (x, y) {
      return x < y ? -1 : x > y ? 1 : 0;
    });
  }

  if (col === undefined) {
    // Tell the draw function that we have sorted the data
    oSettings.bSorted = true;
    oSettings.sortDetails = aSort;

    _fnCallbackFire(oSettings, null, "order", [oSettings, aSort]);
  }

  return displayMaster;
}

export function _fnSortInit(settings) {
  var target = settings.nTHead;
  var headerRows = target.querySelectorAll("tr");
  var titleRow = settings.titleRow;
  var notSelector =
    ':not([data-dt-order="disable"]):not([data-dt-order="icon-only"])';

  // Legacy support for `orderCellsTop`
  if (titleRow === true) {
    target = headerRows[0];
  } else if (titleRow === false) {
    target = headerRows[headerRows.length - 1];
  } else if (titleRow !== null) {
    target = headerRows[titleRow];
  }
  // else - all rows

  if (settings.orderHandler) {
    _fnSortAttachListener(
      settings,
      target,
      target === settings.nTHead
        ? "tr" +
            notSelector +
            " th" +
            notSelector +
            ", tr" +
            notSelector +
            " td" +
            notSelector
        : "th" + notSelector + ", td" + notSelector
    );
  }

  // Need to resolve the user input array into our internal structure
  var order = [];
  _fnSortResolve(settings, order, settings.aaSorting);

  settings.aaSorting = order;
}

export function _fnSortAttachListener(settings, node, selector, column, callback) {
  _fnBindAction(node, selector, function (e) {
    var run = false;
    var columns =
      column === undefined
        ? _fnColumnsFromHeader(e.target)
        : typeof column === "function"
          ? column()
          : Array.isArray(column)
            ? column
            : [column];

    if (columns.length) {
      for (var i = 0, ien = columns.length; i < ien; i++) {
        var ret = _fnSortAdd(settings, columns[i], i, e.shiftKey);

        if (ret !== false) {
          run = true;
        }

        // If the first entry is no sort, then subsequent
        // sort columns are ignored
        if (
          settings.aaSorting.length === 1 &&
          settings.aaSorting[0][1] === ""
        ) {
          break;
        }
      }

      if (run) {
        _fnProcessingRun(settings, true, function () {
          _fnSort(settings);
          _fnSortDisplay(settings, settings.aiDisplay);

          _fnReDraw(settings, false, false, _fnSort);

          if (callback) {
            callback();
          }
        });
      }
    }
  });
}



// Get the data to sort a column, be it from cache, fresh (populating the
// cache), or from a sort formatter
function _fnSortData(settings, colIdx) {
  // Custom sorting function - provided by the sort data type
  var column = settings.aoColumns[colIdx];
  var customSort = _dt_ext_order[column.sSortDataType];
  var customData;

  if (customSort) {
    customData = customSort.call(
      settings.oInstance,
      settings,
      colIdx,
      _fnColumnIndexToVisible(settings, colIdx)
    );
  }

  // Use / populate cache
  var row, cellData;
  var formatter = _dt_ext_types.order[column.sType + "-pre"];
  var data = settings.aoData;

  for (var rowIdx = 0; rowIdx < data.length; rowIdx++) {
    // Sparse array
    if (!data[rowIdx]) {
      continue;
    }

    row = data[rowIdx];

    if (!row._aSortData) {
      row._aSortData = [];
    }

    if (!row._aSortData[colIdx] || customSort) {
      cellData = customSort
        ? customData[rowIdx] // If there was a custom sort function, use data from there
        : _fnGetCellData(settings, rowIdx, colIdx, "sort");

      row._aSortData[colIdx] = formatter
        ? formatter(cellData, settings)
        : cellData;
    }
  }
}


/**
 * Sort the display array to match the master's order
 * @param {*} settings
 */
export function _fnSortDisplay(settings, display) {
  if (display.length < 2) {
    return;
  }

  var master = settings.aiDisplayMaster;
  var masterMap = {};
  var map = {};
  var i;

  // Rather than needing an `indexOf` on master array, we can create a map
  for (i = 0; i < master.length; i++) {
    masterMap[master[i]] = i;
  }

  // And then cache what would be the indexOf fom the display
  for (i = 0; i < display.length; i++) {
    map[display[i]] = masterMap[display[i]];
  }

  display.sort(function (a, b) {
    // Short version of this function is simply `master.indexOf(a) - master.indexOf(b);`
    return map[a] - map[b];
  });
}

/**
 * Function to run on user sort request
 *  @param {object} settings dataTables settings object
 *  @param {node} attachTo node to attach the handler to
 *  @param {int} colIdx column sorting index
 *  @param {int} addIndex Counter
 *  @param {boolean} [shift=false] Shift click add
 *  @param {function} [callback] callback function
 *  @memberof DataTable#oApi
 */
function _fnSortAdd(settings, colIdx, addIndex, shift) {
  var col = settings.aoColumns[colIdx];
  var sorting = settings.aaSorting;
  var asSorting = col.asSorting;
  var nextSortIdx;
  var next = function (a, overflow) {
    var idx = a._idx;
    if (idx === undefined) {
      idx = asSorting.indexOf(a[1]);
    }

    return idx + 1 < asSorting.length ? idx + 1 : overflow ? null : 0;
  };

  if (!col.bSortable) {
    return false;
  }

  // Convert to 2D array if needed
  if (typeof sorting[0] === "number") {
    sorting = settings.aaSorting = [sorting];
  }

  // If appending the sort then we are multi-column sorting
  if ((shift || addIndex) && settings.oFeatures.bSortMulti) {
    // Are we already doing some kind of sort on this column?
    var sortIdx = _pluck(sorting, "0").indexOf(colIdx);

    if (sortIdx !== -1) {
      // Yes, modify the sort
      nextSortIdx = next(sorting[sortIdx], true);

      if (nextSortIdx === null && sorting.length === 1) {
        nextSortIdx = 0; // can't remove sorting completely
      }

      if (nextSortIdx === null || asSorting[nextSortIdx] === "") {
        sorting.splice(sortIdx, 1);
      } else {
        sorting[sortIdx][1] = asSorting[nextSortIdx];
        sorting[sortIdx]._idx = nextSortIdx;
      }
    } else if (shift) {
      // No sort on this column yet, being added by shift click
      // add it as itself
      sorting.push([colIdx, asSorting[0], 0]);
      sorting[sorting.length - 1]._idx = 0;
    } else {
      // No sort on this column yet, being added from a colspan
      // so add with same direction as first column
      sorting.push([colIdx, sorting[0][1], 0]);
      sorting[sorting.length - 1]._idx = 0;
    }
  } else if (sorting.length && sorting[0][0] == colIdx) {
    // Single column - already sorting on this column, modify the sort
    nextSortIdx = next(sorting[0]);

    sorting.length = 1;
    sorting[0][1] = asSorting[nextSortIdx];
    sorting[0]._idx = nextSortIdx;
  } else {
    // Single column - sort only on this column
    sorting.length = 0;
    sorting.push([colIdx, asSorting[0]]);
    sorting[0]._idx = 0;
  }
}

/**
 * Set the sorting classes on table's body, Note: it is safe to call this function
 * when bSort and bSortClasses are false
 *  @param {object} oSettings dataTables settings object
 *  @memberof DataTable#oApi
 */
export function _fnSortingClasses(settings) {
  var oldSort = settings.aLastSort;
  var sortClass = settings.oClasses.order.position;
  var sort = _fnSortFlatten(settings);
  var features = settings.oFeatures;
  var i, ien, colIdx;

  if (features.bSort && features.bSortClasses) {
    // Remove old sorting classes
    for (i = 0, ien = oldSort.length; i < ien; i++) {
      colIdx = oldSort[i].src;

      // Remove column sorting
      $(_pluck(settings.aoData, "anCells", colIdx)).removeClass(
        sortClass + (i < 2 ? i + 1 : 3)
      );
    }

    // Add new column sorting
    for (i = 0, ien = sort.length; i < ien; i++) {
      colIdx = sort[i].src;

      $(_pluck(settings.aoData, "anCells", colIdx)).addClass(
        sortClass + (i < 2 ? i + 1 : 3)
      );
    }
  }

  settings.aLastSort = sort;
}
