/*! DataTables 2.3.2
 * © SpryMedia Ltd - datatables.net/license
 */

import $ from 'jquery';
import { _dt_util } from './api/api.util';
import {
  _fnCamelToHungarian,
  _fnCompatOpts,
  _fnBrowserDetect,
} from './core/core.compat';
import {
  _fnDataSource,
  _fnMap,
  _fnLog,
  _fnListener,
  _fnCallbackReg,
  _fnExtend,
} from './core/core.support';
import { _fnGetObjectDataFn, _fnGetCellData } from './core/core.data';
import { _fnSortingClasses } from './core/core.sort';
import {
  _fnApplyClasses,
  _fnHandleLanguageDefinitions,
  _fnInitialise,
  _fnNormalizeDefaults,
  _fnSetUpColumns,
  _fnStoreHtmlElements,
} from './core/core.init';
import { _fnSaveState } from './core/core.state';
import { _dt_DateTime, _dt_isDataTable, _dt_tables } from './api/api.static';
import { _dt_settings } from './api/api.settings';
import { _dt_datetimeFn, _dt_render } from './ext/ext.helpers';
import { _dt_ext } from './ext/ext';
import { _dt_feature, _registerBuiltInFeatures } from './features/features.api';
import {
  _dt_listTypes,
  _dt_type,
  _registerBuiltInTypes,
} from './ext/ext.types';
import _dt_api from './api/api.all';
import { _dt_models } from './model/model.all';
import { _each, _extend, _isPlainObject } from './core/core.jq';
import { _dt_version, _dt_versionCheck } from './api/api.version';
import { _dt_browser } from './api/api.browser';

const DataTable = function (selector, options) {
  // When creating with `new`, create a new DataTable, returning the API instance
  if (this instanceof DataTable) {
    return $(selector).DataTable(options);
  } else {
    // Argument switching
    options = selector;
  }

  var _that = this;
  var emptyInit = options === undefined;
  var len = this.length;

  if (emptyInit) {
    options = {};
  }

  // Method to get DT API instance from jQuery object
  this.api = function () {
    return new _dt_api(this);
  };

  this.each(async function () {
    // For each initialisation we want to give it a clean initialisation
    // object that can be bashed around
    var o = {};
    var oInit =
      len > 1 // optimisation for single table case
        ? _fnExtend(o, options, true)
        : options;

    var i = 0,
      iLen;
    var sId = this.getAttribute('id');
    var defaults = DataTable.models.defaults;
    var $this = $(this);

    // Sanity check
    if (this.nodeName.toLowerCase() != 'table') {
      _fnLog(
        null,
        0,
        'Non-table node initialisation (' + this.nodeName + ')',
        2
      );
      return;
    }

    // Special case for options
    if (oInit.on && oInit.on.options) {
      _fnListener($this, 'options', oInit.on.options);
    }

    $this.trigger('options.dt', oInit);

    _fnNormalizeDefaults(defaults, $this, oInit);

    /* Check to see if we are re-initialising a table */
    const allSettings = DataTable.settings;
    for (i = 0, iLen = allSettings.length; i < iLen; i++) {
      const s = allSettings[i];

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
          new DataTable.Api(s).destroy();
          break;
        } else {
          _fnLog(s, 0, 'Cannot reinitialise DataTable', 3);
          return;
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

    /* Ensure the table has an ID - required for accessibility */
    if (sId === null || sId === '') {
      sId = 'DataTables_Table_' + DataTable.ext._unique++;
      this.id = sId;
    }

    /* Create the settings object for this table and set some of the default parameters */
    var oSettings = _extend(true, {}, DataTable.models.oSettings, {
      sDestroyWidth: $this[0].style.width,
      sInstance: sId,
      sTableId: sId,
      colgroup: $('<colgroup>').prependTo(this),
      fastData: function (row, column, type) {
        return _fnGetCellData(oSettings, row, column, type);
      },
    });
    oSettings.nTable = this;
    oSettings.oInit = oInit;

    DataTable.settings.push(oSettings);

    // Make a single API instance available for internal handling
    oSettings.api = new _dt_api(oSettings);

    // Need to add the instance after the instance after the settings object has been added
    // to the settings array, so we can self reference the table instance if more than one
    oSettings.oInstance = _that.length === 1 ? _that : $this.dataTable();

    // Backwards compatibility, before we apply all the defaults
    _fnCompatOpts(oInit);

    // If the length menu is given, but the init display length is not, use the length menu
    if (oInit.aLengthMenu && !oInit.iDisplayLength) {
      oInit.iDisplayLength = Array.isArray(oInit.aLengthMenu[0])
        ? oInit.aLengthMenu[0][0]
        : _isPlainObject(oInit.aLengthMenu[0])
          ? oInit.aLengthMenu[0].value
          : oInit.aLengthMenu[0];
    }

    // Apply the defaults and init options to make a single init object will all
    // options defined from defaults and instance options.
    oInit = _fnExtend(_extend(true, {}, defaults), oInit);

    // Map the initialisation options onto the settings object
    _fnMap(oSettings.oFeatures, oInit, [
      'bPaginate',
      'bLengthChange',
      'bFilter',
      'bSort',
      'bSortMulti',
      'bInfo',
      'bProcessing',
      'bAutoWidth',
      'bSortClasses',
      'bServerSide',
      'bDeferRender',
    ]);
    _fnMap(oSettings, oInit, [
      'ajax',
      'fnFormatNumber',
      'sServerMethod',
      'aaSorting',
      'aaSortingFixed',
      'aLengthMenu',
      'sPaginationType',
      'iStateDuration',
      'bSortCellsTop',
      'iTabIndex',
      'sDom',
      'fnStateLoadCallback',
      'fnStateSaveCallback',
      'renderer',
      'searchDelay',
      'rowId',
      'caption',
      'layout',
      'orderDescReverse',
      'orderIndicators',
      'orderHandler',
      'titleRow',
      'typeDetect',
      ['iCookieDuration', 'iStateDuration'], // backwards compat
      ['oSearch', 'oPreviousSearch'],
      ['aoSearchCols', 'aoPreSearchCols'],
      ['iDisplayLength', '_iDisplayLength'],
    ]);
    _fnMap(oSettings.oScroll, oInit, [
      ['sScrollX', 'sX'],
      ['sScrollXInner', 'sXInner'],
      ['sScrollY', 'sY'],
      ['bScrollCollapse', 'bCollapse'],
    ]);
    _fnMap(oSettings.oLanguage, oInit, 'fnInfoCallback');

    /* Callback functions which are array driven */
    _fnCallbackReg(oSettings, 'aoDrawCallback', oInit.fnDrawCallback);
    _fnCallbackReg(oSettings, 'aoStateSaveParams', oInit.fnStateSaveParams);
    _fnCallbackReg(oSettings, 'aoStateLoadParams', oInit.fnStateLoadParams);
    _fnCallbackReg(oSettings, 'aoStateLoaded', oInit.fnStateLoaded);
    _fnCallbackReg(oSettings, 'aoRowCallback', oInit.fnRowCallback);
    _fnCallbackReg(oSettings, 'aoRowCreatedCallback', oInit.fnCreatedRow);
    _fnCallbackReg(oSettings, 'aoHeaderCallback', oInit.fnHeaderCallback);
    _fnCallbackReg(oSettings, 'aoFooterCallback', oInit.fnFooterCallback);
    _fnCallbackReg(oSettings, 'aoInitComplete', oInit.fnInitComplete);
    _fnCallbackReg(oSettings, 'aoPreDrawCallback', oInit.fnPreDrawCallback);

    oSettings.rowIdFn = _fnGetObjectDataFn(oInit.rowId);

    // Add event listeners
    if (oInit.on) {
      Object.keys(oInit.on).forEach(function (key) {
        _fnListener($this, key, oInit.on[key]);
      });
    }

    /* Browser support detection */
    _fnBrowserDetect(oSettings);

    _fnApplyClasses(oSettings, oInit, $this);

    if (!oSettings.oFeatures.bPaginate) {
      oInit.iDisplayStart = 0;
    }

    if (oSettings.iInitDisplayStart === undefined) {
      /* Display start point, taking into account the save saving */
      oSettings.iInitDisplayStart = oInit.iDisplayStart;
      oSettings._iDisplayStart = oInit.iDisplayStart;
    }

    var defer = oInit.iDeferLoading;
    if (defer !== null) {
      oSettings.deferLoading = true;

      var tmp = Array.isArray(defer);
      oSettings._iRecordsDisplay = tmp ? defer[0] : defer;
      oSettings._iRecordsTotal = tmp ? defer[1] : defer;
    }

    var thead = this.getElementsByTagName('thead');

    _fnSetUpColumns(oSettings, oInit, $this, thead);

    // Must be done after everything which can be overridden by the state saving!
    _fnCallbackReg(oSettings, 'aoDrawCallback', _fnSaveState);

    var features = oSettings.oFeatures;
    if (oInit.bStateSave) {
      features.bStateSave = true;
    }

    // If aaSorting is not defined, then we use the first indicator in asSorting
    // in case that has been altered, so the default sort reflects that option
    if (oInit.aaSorting === undefined) {
      var sorting = oSettings.aaSorting;
      for (i = 0, iLen = sorting.length; i < iLen; i++) {
        sorting[i][1] = oSettings.aoColumns[i].asSorting[0];
      }
    }

    // Do a first pass on the sorting classes (allows any size changes to be taken into
    // account, and also will apply sorting disabled classes if disabled
    _fnSortingClasses(oSettings);

    _fnCallbackReg(oSettings, 'aoDrawCallback', function () {
      if (
        oSettings.bSorted ||
        _fnDataSource(oSettings) === 'ssp' ||
        features.bDeferRender
      ) {
        _fnSortingClasses(oSettings);
      }
    });

    _fnStoreHtmlElements(oSettings, $this, thead);

    // Copy the data index array
    oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();

    // Initialisation complete - table can be drawn
    oSettings.bInitialised = true;

    // Language definitions
    await _fnHandleLanguageDefinitions(oSettings, oInit, defaults);
    _fnInitialise(oSettings);
  });
  _that = null;
  return this;
};

DataTable.ext = _dt_ext;
DataTable.util = _dt_util;
DataTable.Api = _dt_api;
DataTable.versionCheck = _dt_versionCheck;
DataTable.isDataTable = _dt_isDataTable;
DataTable.tables = _dt_tables;
DataTable.camelToHungarian = _fnCamelToHungarian;
DataTable.version = _dt_version;
DataTable.__browser = _dt_browser.data;
DataTable.settings = _dt_settings;
DataTable.datetime = _dt_datetimeFn;
DataTable.DateTime = _dt_DateTime;
DataTable.render = _dt_render;
DataTable.models = _dt_models;
DataTable.type = _dt_type;
DataTable.types = _dt_listTypes;
DataTable.feature = _dt_feature;

// set up DataTable apis, types and features
_registerBuiltInTypes();
_registerBuiltInFeatures();

// jQuery access
$.fn.dataTable = DataTable;

// Provide access to the host jQuery object (circular reference)
DataTable.$ = $;

// Legacy aliases
$.fn.dataTableSettings = DataTable.settings;
$.fn.dataTableExt = DataTable.ext;

// With a capital `D` we return a DataTables API instance rather than a
// jQuery object
$.fn.DataTable = function (opts) {
  return $(this).dataTable(opts).api();
};

// All properties that are available to $.fn.dataTable should also be
// available on $.fn.DataTable
_each(DataTable, function (prop, val) {
  $.fn.DataTable[prop] = val;
});

export default DataTable;
