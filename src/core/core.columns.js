import { _fnCompatCols, _fnCamelToHungarian } from "./core.compat";
import { _addClass, _empty, _stringToCss } from "./core.internal";
import { _extend, _isPlainObject } from "./core.jq";
import { _dt_models_column } from "../model/model.column";
import { _dt_models_search } from "../model/model.search";
import { _dt_models_defaults } from "../model/model.defaults";
import { _fnMap, _fnCallbackFire, _fnDataSource } from "./core.support";
import {
  _fnGetObjectDataFn,
  _fnSetObjectDataFn,
  _fnGetCellData,
  _fnWriteCell,
  _fnGetRowDisplay
} from "./core.data";
import { _dt_util } from "../api/api.util";
import { _dt_render } from "../ext/ext.helpers";
import { $ } from "jquery";
import { _dt_ext_types } from "../ext/ext.types";
import { _dt_util_replaceable } from "../api/api.util.replaceable";

/**
 * Add a column to the list used for the table with default values
 *  @param {object} oSettings dataTables settings object
 *  @memberof DataTable#oApi
 */
export function _fnAddColumn(oSettings) {
  // Add column to aoColumns array
  var oDefaults = _dt_models_defaults.column;
  var iCol = oSettings.aoColumns.length;
  var oCol = _extend({}, _dt_models_column, oDefaults, {
    aDataSort: oDefaults.aDataSort ? oDefaults.aDataSort : [iCol],
    mData: oDefaults.mData ? oDefaults.mData : iCol,
    idx: iCol,
    searchFixed: {},
    colEl: $("<col>").attr("data-dt-column", iCol),
  });
  oSettings.aoColumns.push(oCol);

  // Add search object for column specific search. Note that the `searchCols[ iCol ]`
  // passed into extend can be undefined. This allows the user to give a default
  // with only some of the parameters defined, and also not give a default
  var searchCols = oSettings.aoPreSearchCols;
  searchCols[iCol] = _extend({}, _dt_models_search, searchCols[iCol]);
}

/**
 * Apply options for a column
 *  @param {object} oSettings dataTables settings object
 *  @param {int} iCol column index to consider
 *  @param {object} oOptions object with sType, bVisible and bSearchable etc
 *  @memberof DataTable#oApi
 */
export function _fnColumnOptions(oSettings, iCol, oOptions) {
  var oCol = oSettings.aoColumns[iCol];

  /* User specified column options */
  if (oOptions !== undefined && oOptions !== null) {
    // Backwards compatibility
    _fnCompatCols(oOptions);

    // Map camel case parameters to their Hungarian counterparts
    _fnCamelToHungarian(_dt_models_defaults.column, oOptions, true);

    /* Backwards compatibility for mDataProp */
    if (oOptions.mDataProp !== undefined && !oOptions.mData) {
      oOptions.mData = oOptions.mDataProp;
    }

    if (oOptions.sType) {
      oCol._sManualType = oOptions.sType;
    }

    // `class` is a reserved word in Javascript, so we need to provide
    // the ability to use a valid name for the camel case input
    if (oOptions.className && !oOptions.sClass) {
      oOptions.sClass = oOptions.className;
    }

    var origClass = oCol.sClass;

    _extend(oCol, oOptions);
    _fnMap(oCol, oOptions, "sWidth", "sWidthOrig");

    // Merge class from previously defined classes with this one, rather than just
    // overwriting it in the extend above
    if (origClass !== oCol.sClass) {
      oCol.sClass = origClass + " " + oCol.sClass;
    }

    /* iDataSort to be applied (backwards compatibility), but aDataSort will take
     * priority if defined
     */
    if (oOptions.iDataSort !== undefined) {
      oCol.aDataSort = [oOptions.iDataSort];
    }
    _fnMap(oCol, oOptions, "aDataSort");
  }

  /* Cache the data get and set functions for speed */
  var mDataSrc = oCol.mData;
  var mData = _fnGetObjectDataFn(mDataSrc);

  // The `render` option can be given as an array to access the helper rendering methods.
  // The first element is the rendering method to use, the rest are the parameters to pass
  if (oCol.mRender && Array.isArray(oCol.mRender)) {
    var copy = oCol.mRender.slice();
    var name = copy.shift();

    oCol.mRender = _dt_render[name].apply(window, copy);
  }

  oCol._render = oCol.mRender ? _fnGetObjectDataFn(oCol.mRender) : null;

  var attrTest = function (src) {
    return typeof src === "string" && src.indexOf("@") !== -1;
  };
  oCol._bAttrSrc =
    _isPlainObject(mDataSrc) &&
    (attrTest(mDataSrc.sort) ||
      attrTest(mDataSrc.type) ||
      attrTest(mDataSrc.filter));
  oCol._setter = null;

  oCol.fnGetData = function (rowData, type, meta) {
    var innerData = mData(rowData, type, undefined, meta);

    return oCol._render && type
      ? oCol._render(innerData, type, rowData, meta)
      : innerData;
  };
  oCol.fnSetData = function (rowData, val, meta) {
    return _fnSetObjectDataFn(mDataSrc)(rowData, val, meta);
  };

  // Indicate if DataTables should read DOM data as an object or array
  // Used in _fnGetRowElements
  if (typeof mDataSrc !== "number" && !oCol._isArrayHost) {
    oSettings._rowReadObject = true;
  }

  /* Feature sorting overrides column specific when off */
  if (!oSettings.oFeatures.bSort) {
    oCol.bSortable = false;
  }
}

/**
 * Adjust the table column widths for new data. Note: you would probably want to
 * do a redraw after calling this function!
 *  @param {object} settings dataTables settings object
 *  @memberof DataTable#oApi
 */
export function _fnAdjustColumnSizing(settings) {
  _fnCalculateColumnWidths(settings);
  _fnColumnSizes(settings);

  var scroll = settings.oScroll;
  if (scroll.sY !== "" || scroll.sX !== "") {
    _fnScrollDraw(settings);
  }

  _fnCallbackFire(settings, null, "column-sizing", [settings]);
}

/**
 * Apply column sizes
 *
 * @param {*} settings DataTables settings object
 */
function _fnColumnSizes(settings) {
  var cols = settings.aoColumns;

  for (var i = 0; i < cols.length; i++) {
    var width = _fnColumnsSumWidth(settings, [i], false, false);

    cols[i].colEl.css("width", width);

    if (settings.oScroll.sX) {
      cols[i].colEl.css("min-width", width);
    }
  }
}

/**
 * Convert the index of a visible column to the index in the data array (take account
 * of hidden columns)
 *  @param {object} oSettings dataTables settings object
 *  @param {int} iMatch Visible column index to lookup
 *  @returns {int} i the data index
 *  @memberof DataTable#oApi
 */
export function _fnVisibleToColumnIndex(oSettings, iMatch) {
  var aiVis = _fnGetColumns(oSettings, "bVisible");

  return typeof aiVis[iMatch] === "number" ? aiVis[iMatch] : null;
}

/**
 * Convert the index of an index in the data array and convert it to the visible
 *   column index (take account of hidden columns)
 *  @param {int} iMatch Column index to lookup
 *  @param {object} oSettings dataTables settings object
 *  @returns {int} i the data index
 *  @memberof DataTable#oApi
 */
export function _fnColumnIndexToVisible(oSettings, iMatch) {
  var aiVis = _fnGetColumns(oSettings, "bVisible");
  var iPos = aiVis.indexOf(iMatch);

  return iPos !== -1 ? iPos : null;
}

/**
 * Get the number of visible columns
 *  @param {object} oSettings dataTables settings object
 *  @returns {int} i the number of visible columns
 *  @memberof DataTable#oApi
 */
export function _fnVisbleColumns(settings) {
  var layout = settings.aoHeader;
  var columns = settings.aoColumns;
  var vis = 0;

  if (layout.length) {
    for (var i = 0, ien = layout[0].length; i < ien; i++) {
      if (
        columns[i].bVisible &&
        $(layout[0][i].cell).css("display") !== "none"
      ) {
        vis++;
      }
    }
  }

  return vis;
}

/**
 * Get an array of column indexes that match a given property
 *  @param {object} oSettings dataTables settings object
 *  @param {string} sParam Parameter in aoColumns to look for - typically
 *    bVisible or bSearchable
 *  @returns {array} Array of indexes with matched properties
 *  @memberof DataTable#oApi
 */
export function _fnGetColumns(oSettings, sParam) {
  var a = [];

  oSettings.aoColumns.map(function (val, i) {
    if (val[sParam]) {
      a.push(i);
    }
  });

  return a;
}

/**
 * Allow the result from a type detection function to be `true` while
 * translating that into a string. Old type detection functions will
 * return the type name if it passes. An obect store would be better,
 * but not backwards compatible.
 *
 * @param {*} typeDetect Object or function for type detection
 * @param {*} res Result from the type detection function
 * @returns Type name or false
 */
function _typeResult(typeDetect, res) {
  return res === true ? typeDetect._name : res;
}

/**
 * Calculate the 'type' of a column
 *  @param {object} settings dataTables settings object
 *  @memberof DataTable#oApi
 */
export function _fnColumnTypes(settings) {
  var columns = settings.aoColumns;
  var data = settings.aoData;
  var types = _dt_ext_types.detect;
  var i, ien, j, jen, k, ken;
  var col, detectedType, cache;

  // For each column, spin over the data type detection functions, seeing if one matches
  for (i = 0, ien = columns.length; i < ien; i++) {
    col = columns[i];
    cache = [];

    if (!col.sType && col._sManualType) {
      col.sType = col._sManualType;
    } else if (!col.sType) {
      // With SSP type detection can be unreliable and error prone, so we provide a way
      // to turn it off.
      if (!settings.typeDetect) {
        return;
      }

      for (j = 0, jen = types.length; j < jen; j++) {
        var typeDetect = types[j];

        // There can be either one, or three type detection functions
        var oneOf = typeDetect.oneOf;
        var allOf = typeDetect.allOf || typeDetect;
        var init = typeDetect.init;
        var one = false;

        detectedType = null;

        // Fast detect based on column assignment
        if (init) {
          detectedType = _typeResult(typeDetect, init(settings, col, i));

          if (detectedType) {
            col.sType = detectedType;
            break;
          }
        }

        for (k = 0, ken = data.length; k < ken; k++) {
          if (!data[k]) {
            continue;
          }

          // Use a cache array so we only need to get the type data
          // from the formatter once (when using multiple detectors)
          if (cache[k] === undefined) {
            cache[k] = _fnGetCellData(settings, k, i, "type");
          }

          // Only one data point in the column needs to match this function
          if (oneOf && !one) {
            one = _typeResult(typeDetect, oneOf(cache[k], settings));
          }

          // All data points need to match this function
          detectedType = _typeResult(typeDetect, allOf(cache[k], settings));

          // If null, then this type can't apply to this column, so
          // rather than testing all cells, break out. There is an
          // exception for the last type which is `html`. We need to
          // scan all rows since it is possible to mix string and HTML
          // types
          if (!detectedType && j !== types.length - 3) {
            break;
          }

          // Only a single match is needed for html type since it is
          // bottom of the pile and very similar to string - but it
          // must not be empty
          if (detectedType === "html" && !_empty(cache[k])) {
            break;
          }
        }

        // Type is valid for all data points in the column - use this
        // type
        if ((oneOf && one && detectedType) || (!oneOf && detectedType)) {
          col.sType = detectedType;
          break;
        }
      }

      // Fall back - if no type was detected, always use string
      if (!col.sType) {
        col.sType = "string";
      }
    }

    // Set class names for header / footer for auto type classes
    var autoClass = _dt_ext_types.className[col.sType];

    if (autoClass) {
      _columnAutoClass(settings.aoHeader, i, autoClass);
      _columnAutoClass(settings.aoFooter, i, autoClass);
    }

    var renderer = _dt_ext_types.render[col.sType];

    // This can only happen once! There is no way to remove
    // a renderer. After the first time the renderer has
    // already been set so createTr will run the renderer itself.
    if (renderer && !col._render) {
      col._render = _dt_util.get(renderer);

      _columnAutoRender(settings, i);
    }
  }
}

/**
 * Apply an auto detected renderer to data which doesn't yet have
 * a renderer
 */
function _columnAutoRender(settings, colIdx) {
  var data = settings.aoData;

  for (var i = 0; i < data.length; i++) {
    if (data[i].nTr) {
      // We have to update the display here since there is no
      // invalidation check for the data
      var display = _fnGetCellData(settings, i, colIdx, "display");

      data[i].displayData[colIdx] = display;
      _fnWriteCell(data[i].anCells[colIdx], display);

      // No need to update sort / filter data since it has
      // been invalidated and will be re-read with the
      // renderer now applied
    }
  }
}

/**
 * Apply a class name to a column's header cells
 */
function _columnAutoClass(container, colIdx, className) {
  container.forEach(function (row) {
    if (row[colIdx] && row[colIdx].unique) {
      _addClass(row[colIdx].cell, className);
    }
  });
}

/**
 * Take the column definitions and static columns arrays and calculate how
 * they relate to column indexes. The callback function will then apply the
 * definition found for a column to a suitable configuration object.
 *  @param {object} oSettings dataTables settings object
 *  @param {array} aoColDefs The aoColumnDefs array that is to be applied
 *  @param {array} aoCols The aoColumns array that defines columns individually
 *  @param {array} headerLayout Layout for header as it was loaded
 *  @param {function} fn Callback function - takes two parameters, the calculated
 *    column index and the definition for that column.
 *  @memberof DataTable#oApi
 */
export function _fnApplyColumnDefs(
  oSettings,
  aoColDefs,
  aoCols,
  headerLayout,
  fn
) {
  var i, iLen, j, jLen, k, kLen, def;
  var columns = oSettings.aoColumns;

  if (aoCols) {
    for (i = 0, iLen = aoCols.length; i < iLen; i++) {
      if (aoCols[i] && aoCols[i].name) {
        columns[i].sName = aoCols[i].name;
      }
    }
  }

  // Column definitions with aTargets
  if (aoColDefs) {
    /* Loop over the definitions array - loop in reverse so first instance has priority */
    for (i = aoColDefs.length - 1; i >= 0; i--) {
      def = aoColDefs[i];

      /* Each definition can target multiple columns, as it is an array */
      var aTargets =
        def.target !== undefined
          ? def.target
          : def.targets !== undefined
            ? def.targets
            : def.aTargets;

      if (!Array.isArray(aTargets)) {
        aTargets = [aTargets];
      }

      for (j = 0, jLen = aTargets.length; j < jLen; j++) {
        var target = aTargets[j];

        if (typeof target === "number" && target >= 0) {
          /* Add columns that we don't yet know about */
          while (columns.length <= target) {
            _fnAddColumn(oSettings);
          }

          /* Integer, basic index */
          fn(target, def);
        } else if (typeof target === "number" && target < 0) {
          /* Negative integer, right to left column counting */
          fn(columns.length + target, def);
        } else if (typeof target === "string") {
          for (k = 0, kLen = columns.length; k < kLen; k++) {
            if (target === "_all") {
              // Apply to all columns
              fn(k, def);
            } else if (target.indexOf(":name") !== -1) {
              // Column selector
              if (columns[k].sName === target.replace(":name", "")) {
                fn(k, def);
              }
            } else {
              // Cell selector
              headerLayout.forEach(function (row) {
                if (row[k]) {
                  var cell = $(row[k].cell);

                  // Legacy support. Note that it means that we don't support
                  // an element name selector only, since they are treated as
                  // class names for 1.x compat.
                  if (target.match(/^[a-z][\w-]*$/i)) {
                    target = "." + target;
                  }

                  if (cell.is(target)) {
                    fn(k, def);
                  }
                }
              });
            }
          }
        }
      }
    }
  }

  // Statically defined columns array
  if (aoCols) {
    for (i = 0, iLen = aoCols.length; i < iLen; i++) {
      fn(i, aoCols[i]);
    }
  }
}

/**
 * Get the width for a given set of columns
 *
 * @param {*} settings DataTables settings object
 * @param {*} targets Columns - comma separated string or array of numbers
 * @param {*} original Use the original width (true) or calculated (false)
 * @param {*} incVisible Include visible columns (true) or not (false)
 * @returns Combined CSS value
 */
export function _fnColumnsSumWidth(settings, targets, original, incVisible) {
  if (!Array.isArray(targets)) {
    targets = _fnColumnsFromHeader(targets);
  }

  var sum = 0;
  var unit;
  var columns = settings.aoColumns;

  for (var i = 0, ien = targets.length; i < ien; i++) {
    var column = columns[targets[i]];
    var definedWidth = original ? column.sWidthOrig : column.sWidth;

    if (!incVisible && column.bVisible === false) {
      continue;
    }

    if (definedWidth === null || definedWidth === undefined) {
      return null; // can't determine a defined width - browser defined
    } else if (typeof definedWidth === "number") {
      unit = "px";
      sum += definedWidth;
    } else {
      var matched = definedWidth.match(/([\d\.]+)([^\d]*)/);

      if (matched) {
        sum += matched[1] * 1;
        unit = matched.length === 3 ? matched[2] : "px";
      }
    }
  }

  return sum + unit;
}

export function _fnColumnsFromHeader(cell) {
  var attr = $(cell).closest("[data-dt-column]").attr("data-dt-column");

  if (!attr) {
    return [];
  }

  return attr.split(",").map(function (val) {
    return val * 1;
  });
}


/**
 * Calculate the width of columns for the table
 *  @param {object} settings dataTables settings object
 *  @memberof DataTable#oApi
 */
export function _fnCalculateColumnWidths(settings) {
  // Not interested in doing column width calculation if auto-width is disabled
  if (!settings.oFeatures.bAutoWidth) {
    return;
  }

  var table = settings.nTable,
    columns = settings.aoColumns,
    scroll = settings.oScroll,
    scrollY = scroll.sY,
    scrollX = scroll.sX,
    scrollXInner = scroll.sXInner,
    visibleColumns = _fnGetColumns(settings, "bVisible"),
    tableWidthAttr = table.getAttribute("width"), // from DOM element
    tableContainer = table.parentNode,
    i,
    column,
    columnIdx;

  var styleWidth = table.style.width;
  var containerWidth = _fnWrapperWidth(settings);

  // Don't re-run for the same width as the last time
  if (containerWidth === settings.containerWidth) {
    return false;
  }

  settings.containerWidth = containerWidth;

  // If there is no width applied as a CSS style or as an attribute, we assume that
  // the width is intended to be 100%, which is usually is in CSS, but it is very
  // difficult to correctly parse the rules to get the final result.
  if (!styleWidth && !tableWidthAttr) {
    table.style.width = "100%";
    styleWidth = "100%";
  }

  if (styleWidth && styleWidth.indexOf("%") !== -1) {
    tableWidthAttr = styleWidth;
  }

  // Let plug-ins know that we are doing a recalc, in case they have changed any of the
  // visible columns their own way (e.g. Responsive uses display:none).
  _fnCallbackFire(
    settings,
    null,
    "column-calc",
    { visible: visibleColumns },
    false
  );

  // Construct a single row, worst case, table with the widest
  // node in the data, assign any user defined widths, then insert it into
  // the DOM and allow the browser to do all the hard work of calculating
  // table widths
  var tmpTable = $(table.cloneNode())
    .css("visibility", "hidden")
    .removeAttr("id");

  // Clean up the table body
  tmpTable.append("<tbody/>");
  var tr = $("<tr/>").appendTo(tmpTable.find("tbody"));

  // Clone the table header and footer - we can't use the header / footer
  // from the cloned table, since if scrolling is active, the table's
  // real header and footer are contained in different table tags
  tmpTable
    .append($(settings.nTHead).clone())
    .append($(settings.nTFoot).clone());

  // Remove any assigned widths from the footer (from scrolling)
  tmpTable.find("tfoot th, tfoot td").css("width", "");

  // Apply custom sizing to the cloned header
  tmpTable.find("thead th, thead td").each(function () {
    // Get the `width` from the header layout
    var width = _fnColumnsSumWidth(settings, this, true, false);

    if (width) {
      this.style.width = width;

      // For scrollX we need to force the column width otherwise the
      // browser will collapse it. If this width is smaller than the
      // width the column requires, then it will have no effect
      if (scrollX) {
        this.style.minWidth = width;

        $(this).append(
          $("<div/>").css({
            width: width,
            margin: 0,
            padding: 0,
            border: 0,
            height: 1,
          })
        );
      }
    } else {
      this.style.width = "";
    }
  });

  // Find the widest piece of data for each column and put it into the table
  for (i = 0; i < visibleColumns.length; i++) {
    columnIdx = visibleColumns[i];
    column = columns[columnIdx];

    var longest = _fnGetMaxLenString(settings, columnIdx);
    var autoClass = _dt_ext_types.className[column.sType];
    var text = longest + column.sContentPadding;
    var insert =
      longest.indexOf("<") === -1 ? document.createTextNode(text) : text;

    $("<td/>")
      .addClass(autoClass)
      .addClass(column.sClass)
      .append(insert)
      .appendTo(tr);
  }

  // Tidy the temporary table - remove name attributes so there aren't
  // duplicated in the dom (radio elements for example)
  $("[name]", tmpTable).removeAttr("name");

  // Table has been built, attach to the document so we can work with it.
  // A holding element is used, positioned at the top of the container
  // with minimal height, so it has no effect on if the container scrolls
  // or not. Otherwise it might trigger scrolling when it actually isn't
  // needed
  var holder = $("<div/>")
    .css(
      scrollX || scrollY
        ? {
            position: "absolute",
            top: 0,
            left: 0,
            height: 1,
            right: 0,
            overflow: "hidden",
          }
        : {}
    )
    .append(tmpTable)
    .appendTo(tableContainer);

  // When scrolling (X or Y) we want to set the width of the table as
  // appropriate. However, when not scrolling leave the table width as it
  // is. This results in slightly different, but I think correct behaviour
  if (scrollX && scrollXInner) {
    tmpTable.width(scrollXInner);
  } else if (scrollX) {
    tmpTable.css("width", "auto");
    tmpTable.removeAttr("width");

    // If there is no width attribute or style, then allow the table to
    // collapse
    if (tmpTable.outerWidth() < tableContainer.clientWidth && tableWidthAttr) {
      tmpTable.outerWidth(tableContainer.clientWidth);
    }
  } else if (scrollY) {
    tmpTable.outerWidth(tableContainer.clientWidth);
  } else if (tableWidthAttr) {
    tmpTable.outerWidth(tableWidthAttr);
  }

  // Get the width of each column in the constructed table
  var total = 0;
  var bodyCells = tmpTable.find("tbody tr").eq(0).children();

  for (i = 0; i < visibleColumns.length; i++) {
    // Use getBounding for sub-pixel accuracy, which we then want to round up!
    var bounding = bodyCells[i].getBoundingClientRect().width;

    // Total is tracked to remove any sub-pixel errors as the outerWidth
    // of the table might not equal the total given here
    total += bounding;

    // Width for each column to use
    columns[visibleColumns[i]].sWidth = _stringToCss(bounding);
  }

  table.style.width = _stringToCss(total);

  // Finished with the table - ditch it
  holder.remove();

  // If there is a width attr, we want to attach an event listener which
  // allows the table sizing to automatically adjust when the window is
  // resized. Use the width attr rather than CSS, since we can't know if the
  // CSS is a relative value or absolute - DOM read is always px.
  if (tableWidthAttr) {
    table.style.width = _stringToCss(tableWidthAttr);
  }

  if ((tableWidthAttr || scrollX) && !settings._reszEvt) {
    var resize = _dt_util.throttle(function () {
      var newWidth = _fnWrapperWidth(settings);

      // Don't do it if destroying or the container width is 0
      if (!settings.bDestroying && newWidth !== 0) {
        _fnAdjustColumnSizing(settings);
      }
    });

    // For browsers that support it (~2020 onwards for wide support) we can watch for the
    // container changing width.
    if (window.ResizeObserver) {
      // This is a tricky beast - if the element is visible when `.observe()` is called,
      // then the callback is immediately run. Which we don't want. If the element isn't
      // visible, then it isn't run, but we want it to run when it is then made visible.
      // This flag allows the above to be satisfied.
      var first = $(settings.nTableWrapper).is(":visible");

      // Use an empty div to attach the observer so it isn't impacted by height changes
      var resizer = $("<div>")
        .css({
          width: "100%",
          height: 0,
        })
        .addClass("dt-autosize")
        .appendTo(settings.nTableWrapper);

      settings.resizeObserver = new ResizeObserver(function (e) {
        if (first) {
          first = false;
        } else {
          resize();
        }
      });

      settings.resizeObserver.observe(resizer[0]);
    } else {
      // For old browsers, the best we can do is listen for a window resize
      $(window).on("resize.DT-" + settings.sInstance, resize);
    }

    settings._reszEvt = true;
  }
}

/**
 * Get the width of the DataTables wrapper element
 *
 * @param {*} settings DataTables settings object
 * @returns Width
 */
function _fnWrapperWidth(settings) {
  return $(settings.nTableWrapper).is(":visible")
    ? $(settings.nTableWrapper).width()
    : 0;
}

/**
 * Get the maximum strlen for each data column
 *  @param {object} settings dataTables settings object
 *  @param {int} colIdx column of interest
 *  @returns {string} string of the max length
 *  @memberof DataTable#oApi
 */
function _fnGetMaxLenString(settings, colIdx) {
  var column = settings.aoColumns[colIdx];

  if (!column.maxLenString) {
    var s,
      max = "",
      maxLen = -1;

    for (var i = 0, ien = settings.aiDisplayMaster.length; i < ien; i++) {
      var rowIdx = settings.aiDisplayMaster[i];
      var data = _fnGetRowDisplay(settings, rowIdx)[colIdx];

      var cellString =
        data && typeof data === "object" && data.nodeType
          ? data.innerHTML
          : data + "";

      // Remove id / name attributes from elements so they
      // don't interfere with existing elements
      cellString = cellString
        .replace(/id=".*?"/g, "")
        .replace(/name=".*?"/g, "");

      s = _dt_util_replaceable.stripHtml(cellString).replace(/&nbsp;/g, " ");

      if (s.length > maxLen) {
        // We want the HTML in the string, but the length that
        // is important is the stripped string
        max = cellString;
        maxLen = s.length;
      }
    }

    column.maxLenString = max;
  }

  return column.maxLenString;
}

/**
 * Re-insert the `col` elements for current visibility
 *
 * @param {*} settings DT settings
 */
export function _colGroup(settings) {
  var cols = settings.aoColumns;

  settings.colgroup.empty();

  for (let i = 0; i < cols.length; i++) {
    if (cols[i].bVisible) {
      settings.colgroup.append(cols[i].colEl);
    }
  }
}


/**
 * Update the header, footer and body tables for resizing - i.e. column
 * alignment.
 *
 * Welcome to the most horrible function DataTables. The process that this
 * function follows is basically:
 *   1. Re-create the table inside the scrolling div
 *   2. Correct colgroup > col values if needed
 *   3. Copy colgroup > col over to header and footer
 *   4. Clean up
 *
 *  @param {object} settings dataTables settings object
 *  @memberof DataTable#oApi
 */
export function _fnScrollDraw(settings) {
  // Given that this is such a monster function, a lot of variables are use
  // to try and keep the minimised size as small as possible
  var scroll = settings.oScroll,
    barWidth = scroll.iBarWidth,
    divHeader = $(settings.nScrollHead),
    divHeaderInner = divHeader.children("div"),
    divHeaderTable = divHeaderInner.children("table"),
    divBodyEl = settings.nScrollBody,
    divBody = $(divBodyEl),
    divFooter = $(settings.nScrollFoot),
    divFooterInner = divFooter.children("div"),
    divFooterTable = divFooterInner.children("table"),
    header = $(settings.nTHead),
    table = $(settings.nTable),
    footer =
      settings.nTFoot && $("th, td", settings.nTFoot).length
        ? $(settings.nTFoot)
        : null,
    browser = settings.oBrowser,
    headerCopy,
    footerCopy;

  // If the scrollbar visibility has changed from the last draw, we need to
  // adjust the column sizes as the table width will have changed to account
  // for the scrollbar
  var scrollBarVis = divBodyEl.scrollHeight > divBodyEl.clientHeight;

  if (
    settings.scrollBarVis !== scrollBarVis &&
    settings.scrollBarVis !== undefined
  ) {
    settings.scrollBarVis = scrollBarVis;
    _fnAdjustColumnSizing(settings);
    return; // adjust column sizing will call this function again
  } else {
    settings.scrollBarVis = scrollBarVis;
  }

  // 1. Re-create the table inside the scrolling div
  // Remove the old minimised thead and tfoot elements in the inner table
  table.children("thead, tfoot").remove();

  // Clone the current header and footer elements and then place it into the inner table
  headerCopy = header.clone().prependTo(table);
  headerCopy.find("th, td").removeAttr("tabindex");
  headerCopy.find("[id]").removeAttr("id");

  if (footer) {
    footerCopy = footer.clone().prependTo(table);
    footerCopy.find("[id]").removeAttr("id");
  }

  // 2. Correct colgroup > col values if needed
  // It is possible that the cell sizes are smaller than the content, so we need to
  // correct colgroup>col for such cases. This can happen if the auto width detection
  // uses a cell which has a longer string, but isn't the widest! For example
  // "Chief Executive Officer (CEO)" is the longest string in the demo, but
  // "Systems Administrator" is actually the widest string since it doesn't collapse.
  // Note the use of translating into a column index to get the `col` element. This
  // is because of Responsive which might remove `col` elements, knocking the alignment
  // of the indexes out.
  if (settings.aiDisplay.length) {
    // Get the column sizes from the first row in the table. This should really be a
    // [].find, but it wasn't supported in Chrome until Sept 2015, and DT has 10 year
    // browser support
    var firstTr = null;
    var start = _fnDataSource(settings) !== "ssp" ? settings._iDisplayStart : 0;

    for (i = start; i < start + settings.aiDisplay.length; i++) {
      var idx = settings.aiDisplay[i];
      var tr = settings.aoData[idx].nTr;

      if (tr) {
        firstTr = tr;
        break;
      }
    }

    if (firstTr) {
      var colSizes = $(firstTr)
        .children("th, td")
        .map(function (vis) {
          return {
            idx: _fnVisibleToColumnIndex(settings, vis),
            width: $(this).outerWidth(),
          };
        });

      // Check against what the colgroup > col is set to and correct if needed
      for (var i = 0; i < colSizes.length; i++) {
        var colEl = settings.aoColumns[colSizes[i].idx].colEl[0];
        var colWidth = colEl.style.width.replace("px", "");

        if (colWidth !== colSizes[i].width) {
          colEl.style.width = colSizes[i].width + "px";

          if (scroll.sX) {
            colEl.style.minWidth = colSizes[i].width + "px";
          }
        }
      }
    }
  }

  // 3. Copy the colgroup over to the header and footer
  divHeaderTable.find("colgroup").remove();

  divHeaderTable.append(settings.colgroup.clone());

  if (footer) {
    divFooterTable.find("colgroup").remove();

    divFooterTable.append(settings.colgroup.clone());
  }

  // "Hide" the header and footer that we used for the sizing. We need to keep
  // the content of the cell so that the width applied to the header and body
  // both match, but we want to hide it completely.
  $("th, td", headerCopy).each(function () {
    $(this.childNodes).wrapAll('<div class="dt-scroll-sizing">');
  });

  if (footer) {
    $("th, td", footerCopy).each(function () {
      $(this.childNodes).wrapAll('<div class="dt-scroll-sizing">');
    });
  }

  // 4. Clean up
  // Figure out if there are scrollbar present - if so then we need a the header and footer to
  // provide a bit more space to allow "overflow" scrolling (i.e. past the scrollbar)
  var isScrolling =
    Math.floor(table.height()) > divBodyEl.clientHeight ||
    divBody.css("overflow-y") == "scroll";
  var paddingSide = "padding" + (browser.bScrollbarLeft ? "Left" : "Right");

  // Set the width's of the header and footer tables
  var outerWidth = table.outerWidth();

  divHeaderTable.css("width", _stringToCss(outerWidth));
  divHeaderInner
    .css("width", _stringToCss(outerWidth))
    .css(paddingSide, isScrolling ? barWidth + "px" : "0px");

  if (footer) {
    divFooterTable.css("width", _stringToCss(outerWidth));
    divFooterInner
      .css("width", _stringToCss(outerWidth))
      .css(paddingSide, isScrolling ? barWidth + "px" : "0px");
  }

  // Correct DOM ordering for colgroup - comes before the thead
  table.children("colgroup").prependTo(table);

  // Adjust the position of the header in case we loose the y-scrollbar
  divBody.trigger("scroll");

  // If sorting or filtering has occurred, jump the scrolling back to the top
  // only if we aren't holding the position
  if ((settings.bSorted || settings.bFiltered) && !settings._drawHold) {
    divBodyEl.scrollTop = 0;
  }
}
