import { _dt_models_search } from './model.search';
import { _dt_models_row } from './model.row';
import { _dt_models_column } from './model.column';
import { _dt_models_defaults } from './model.defaults';
import { _dt_models_settings } from './model.settings';

/**
 * Object models container, for the various models that DataTables has
 * available to it. These models define the objects that are used to hold
 * the active state and configuration of the table.
 *  @namespace
 */
export const _dt_models = {
  /**
   * Template object for the way in which DataTables holds information about
   * search information for the global filter and individual column filters.
   *  @namespace
   */
  oSearch: _dt_models_search,

  /**
   * Template object for the way in which DataTables holds information about
   * each individual row. This is the object format used for the settings
   * aoData array.
   *  @namespace
   */
  oRow: _dt_models_row,

  /**
   * Template object for the column information object in DataTables. This object
   * is held in the settings aoColumns array and contains all the information that
   * DataTables needs about each individual column.
   *
   * Note that this object is related to {@link DataTable.defaults.column}
   * but this one is the internal data store for DataTables's cache of columns.
   * It should NOT be manipulated outside of DataTables. Any configuration should
   * be done through the initialisation options.
   *  @namespace
   */
  oColumn: _dt_models_column,

  /**
   * Initialisation options that can be given to DataTables at initialisation
   * time.
   *  @namespace
   */
  defaults: _dt_models_defaults,

  /**
   * DataTables settings object - this holds all the information needed for a
   * given table, including configuration, data and current application of the
   * table options. DataTables does not have a single instance for each DataTable
   * with the settings attached to that instance, but rather instances of the
   * DataTable "class" are created on-the-fly as needed (typically by a
   * $().dataTable() call) and the settings object is then applied to that
   * instance.
   *
   * Note that this object is related to {@link DataTable.defaults} but this
   * one is the internal data store for DataTables's cache of columns. It should
   * NOT be manipulated outside of DataTables. Any configuration should be done
   * through the initialisation options.
   */
  oSettings: _dt_models_settings,
};
