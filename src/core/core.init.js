import {
  _fnAddColumn,
  _fnApplyColumnDefs,
  _fnColumnOptions,
  _colGroup,
} from './core.columns';
import {
  _fnCallbackFire,
  _fnDataSource,
  _fnEscapeObject,
  _fnLog,
} from './core.support';
import {
  _fnBuildHead,
  _fnDrawHead,
  _fnReDraw,
  _fnAddOptionsHtml,
  _fnDetectHeader,
} from './core.draw';
import { _fnAddData, _fnAddTr } from './core.data';
import { _fnProcessingDisplay } from './core.processing';
import { _fnBuildAjax, _fnAjaxDataSrc } from './core.ajax';
import { _fnSortInit, _fnSort } from './core.sort';
import { _fnLoadState } from './core.state';
import {
  _fnCompatOpts,
  _fnCompatCols,
  _fnCamelToHungarian,
} from './core.compat';
import $ from 'jquery';
import { _dt_api } from '../api/api.base';
import { _extend } from './core.jq';
import { _dt_ext_classes } from '../ext/ext.classes';
import { _fnInitComplete } from './core.initComplete';

/**
 * Normalize the oInit object based on the defaults and the table's initialisation options
 * @param {object} defaults The default options
 * @param {jQuery} $table The table jQuery object
 * @param {object} oInit The initialisation options
 */
export function _fnNormalizeDefaults(defaults, $table, oInit) {
  _fnCompatOpts(defaults);
  _fnCompatCols(defaults.column);

  _fnCamelToHungarian(defaults, defaults, true);
  _fnCamelToHungarian(defaults.column, defaults.column, true);

  _fnCamelToHungarian(
    defaults,
    _extend(oInit, _fnEscapeObject($table.data())),
    true
  );
}

export function _fnCheckReInit(allSettings, oInit, defaults, emptyInit) {
  /* Check to see if we are re-initialising a table */
  for (let i = 0, iLen = allSettings.length; i < iLen; i++) {
    var s = allSettings[i];

    /* Base check on table node */
    if (
      s.nTable == this ||
      (s.nTHead && s.nTHead.parentNode == this) ||
      (s.nTFoot && s.nTFoot.parentNode == this)
    ) {
      var bRetrieve =
        oInit.bRetrieve !== undefined ? oInit.bRetrieve : defaults.bRetrieve;
      var bDestroy =
        oInit.bDestroy !== undefined ? oInit.bDestroy : defaults.bDestroy;

      if (emptyInit || bRetrieve) {
        return s.oInstance;
      } else if (bDestroy) {
        new _dt_api(s).destroy();
        break;
      } else {
        _fnLog(s, 0, 'Cannot reinitialise DataTable', 3);
        throw new Error('Cannot reinitialise DataTable');
      }
    }

    /* If the element we are initialising has the same ID as a table which was previously
     * initialised, but the table nodes don't match (from before) then we destroy the old
     * instance by simply deleting it. This is under the assumption that the table has been
     * destroyed by other methods. Anyone using non-id selectors will need to do this manually
     */
    if (s.sTableId == this.id) {
      allSettings.splice(i, 1);
      break;
    }
  }
}

/**
 * Set up the column information from the initialisation object
 * @param {*} oSettings DataTables settings object
 * @param {*} oInit DataTables initialisation object
 * @param {*} thead Thead element
 */
export function _fnSetUpColumns(oSettings, oInit, $this, thead) {
  var columnsInit = [];
  var initHeaderLayout = _fnDetectHeader(oSettings, thead[0]);

  // If we don't have a columns array, then generate one with nulls
  if (oInit.aoColumns) {
    columnsInit = oInit.aoColumns;
  } else if (initHeaderLayout.length) {
    for (let i = 0, iLen = initHeaderLayout[0].length; i < iLen; i++) {
      columnsInit.push(null);
    }
  }

  // Add the columns
  for (let i = 0, iLen = columnsInit.length; i < iLen; i++) {
    _fnAddColumn(oSettings);
  }

  // Apply the column definitions
  _fnApplyColumnDefs(
    oSettings,
    oInit.aoColumnDefs,
    columnsInit,
    initHeaderLayout,
    function (iCol, oDef) {
      _fnColumnOptions(oSettings, iCol, oDef);
    }
  );

  /* HTML5 attribute detection - build an mData object automatically if the
   * attributes are found
   */
  var rowOne = $this.children('tbody').find('tr:first-child').eq(0);

  if (rowOne.length) {
    var a = function (cell, name) {
      return cell.getAttribute('data-' + name) !== null ? name : null;
    };

    $(rowOne[0])
      .children('th, td')
      .each(function (i, cell) {
        var col = oSettings.aoColumns[i];

        if (!col) {
          _fnLog(oSettings, 0, 'Incorrect column count', 18);
        }

        if (col.mData === i) {
          var sort = a(cell, 'sort') || a(cell, 'order');
          var filter = a(cell, 'filter') || a(cell, 'search');

          if (sort !== null || filter !== null) {
            col.mData = {
              _: i + '.display',
              sort: sort !== null ? i + '.@data-' + sort : undefined,
              type: sort !== null ? i + '.@data-' + sort : undefined,
              filter: filter !== null ? i + '.@data-' + filter : undefined,
            };
            col._isArrayHost = true;

            _fnColumnOptions(oSettings, i);
          }
        }
      });
  }
}

/**
 * Table HTML init
 * Cache the header, body and footer as required, creating them if needed
 */
export function _fnStoreHtmlElements(oSettings, $this, thead) {
  /*
   * Table HTML init
   * Cache the header, body and footer as required, creating them if needed
   */
  var caption = $this.children('caption');

  if (oSettings.caption) {
    if (caption.length === 0) {
      caption = $('<caption/>').appendTo($this);
    }

    caption.html(oSettings.caption);
  }

  // Store the caption side, so we can remove the element from the document
  // when creating the element
  if (caption.length) {
    caption[0]._captionSide = caption.css('caption-side');
    oSettings.captionNode = caption[0];
  }

  if (thead.length === 0) {
    thead = $('<thead/>').appendTo($this);
  }
  oSettings.nTHead = thead[0];

  var tbody = $this.children('tbody');
  if (tbody.length === 0) {
    tbody = $('<tbody/>').insertAfter(thead);
  }
  oSettings.nTBody = tbody[0];

  var tfoot = $this.children('tfoot');
  if (tfoot.length === 0) {
    // If we are a scrolling table, and no footer has been given, then we need to create
    // a tfoot element for the caption element to be appended to
    tfoot = $('<tfoot/>').appendTo($this);
  }
  oSettings.nTFoot = tfoot[0];
}

/**
 * Apply classes to the table, based on the settings and init options
 * @param {object} oSettings
 * @param {object} oInit
 * @param {jQuery} $this
 */
export function _fnApplyClasses(oSettings, oInit, $this) {
  var oClasses = oSettings.oClasses;

  _extend(oClasses, _dt_ext_classes, oInit.oClasses);
  $this.addClass(oClasses.table);
}

/**
 * Handle language definitions for the table
 * @param {object} oSettings
 * @param {object} oInit
 * @param {object} defaults
 */
export async function _fnHandleLanguageDefinitions(oSettings, oInit, defaults) {
  // Language definitions
  var oLanguage = oSettings.oLanguage;
  _extend(true, oLanguage, oInit.oLanguage);

  if (!oLanguage.sUrl) {
    _fnCallbackFire(oSettings, null, 'i18n', [oSettings], true);
    return;
  }

  // Get the language definitions from a file
  try {
    const json = await $.ajax({
      dataType: 'json',
      url: oLanguage.sUrl,
    });

    _fnCamelToHungarian(defaults.oLanguage, json);
    _extend(true, oLanguage, json, oSettings.oInit.oLanguage);
    _fnCallbackFire(oSettings, null, 'i18n', [oSettings], true);
  } catch (e) {
    _fnLog(oSettings, 0, 'i18n file loading error', 21);
    // Continue on as best we can
  }
}

/**
 * Draw the table for the first time, adding all required features
 *  @param {object} settings dataTables settings object
 *  @memberof DataTable#oApi
 */
export function _fnInitialise(settings) {
  var i;
  var init = settings.oInit;
  var deferLoading = settings.deferLoading;
  var dataSrc = _fnDataSource(settings);

  // Ensure that the table data is fully initialised
  if (!settings.bInitialised) {
    setTimeout(function () {
      _fnInitialise(settings);
    }, 200);
    return;
  }

  // Build the header / footer for the table
  _fnBuildHead(settings, 'header');
  _fnBuildHead(settings, 'footer');

  // Load the table's state (if needed) and then render around it and draw
  _fnLoadState(settings, init, function () {
    // Then draw the header / footer
    _fnDrawHead(settings, settings.aoHeader);
    _fnDrawHead(settings, settings.aoFooter);

    // Cache the paging start point, as the first redraw will reset it
    var iAjaxStart = settings.iInitDisplayStart;

    // Local data load
    // Check if there is data passing into the constructor
    if (init.aaData) {
      for (i = 0; i < init.aaData.length; i++) {
        _fnAddData(settings, init.aaData[i]);
      }
    } else if (deferLoading || dataSrc == 'dom') {
      // Grab the data from the page
      _fnAddTr(settings, $(settings.nTBody).children('tr'));
    }

    // Filter not yet applied - copy the display master
    settings.aiDisplay = settings.aiDisplayMaster.slice();

    // Enable features
    _fnAddOptionsHtml(settings);
    _fnSortInit(settings);

    _colGroup(settings);

    /* Okay to show that something is going on now */
    _fnProcessingDisplay(settings, true);

    _fnCallbackFire(settings, null, 'preInit', [settings], true);

    // If there is default sorting required - let's do it. The sort function
    // will do the drawing for us. Otherwise we draw the table regardless of the
    // Ajax source - this allows the table to look initialised for Ajax sourcing
    // data (show 'loading' message possibly)
    _fnReDraw(settings, undefined, undefined, _fnSort);

    // Server-side processing init complete is done by _fnAjaxUpdateDraw
    if (dataSrc != 'ssp' || deferLoading) {
      // if there is an ajax source load the data
      if (dataSrc == 'ajax') {
        _fnBuildAjax(
          settings,
          {},
          function (json) {
            var aData = _fnAjaxDataSrc(settings, json);

            // Got the data - add it to the table
            for (i = 0; i < aData.length; i++) {
              _fnAddData(settings, aData[i]);
            }

            // Reset the init display for cookie saving. We've already done
            // a filter, and therefore cleared it before. So we need to make
            // it appear 'fresh'
            settings.iInitDisplayStart = iAjaxStart;

            _fnReDraw(settings, undefined, undefined, _fnSort);
            _fnProcessingDisplay(settings, false);
            _fnInitComplete(settings);
          },
          settings
        );
      } else {
        _fnInitComplete(settings);
        _fnProcessingDisplay(settings, false);
      }
    }
  });
}
