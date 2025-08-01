import { _dt_ext_types } from '../ext/ext.types';
import { _pluck } from './core.internal';
import { _isPlainObject } from './core.jq';

export function _fnSortFlatten(settings) {
  var i,
    k,
    kLen,
    aSort = [],
    extSort = _dt_ext_types.order,
    aoColumns = settings.aoColumns,
    aDataSort,
    iCol,
    sType,
    srcCol,
    fixed = settings.aaSortingFixed,
    fixedObj = _isPlainObject(fixed),
    nestedSort = [];

  if (!settings.oFeatures.bSort) {
    return aSort;
  }

  // Build the sort array, with pre-fix and post-fix options if they have been
  // specified
  if (Array.isArray(fixed)) {
    _fnSortResolve(settings, nestedSort, fixed);
  }

  if (fixedObj && fixed.pre) {
    _fnSortResolve(settings, nestedSort, fixed.pre);
  }

  _fnSortResolve(settings, nestedSort, settings.aaSorting);

  if (fixedObj && fixed.post) {
    _fnSortResolve(settings, nestedSort, fixed.post);
  }

  for (i = 0; i < nestedSort.length; i++) {
    srcCol = nestedSort[i][0];

    if (aoColumns[srcCol]) {
      aDataSort = aoColumns[srcCol].aDataSort;

      for (k = 0, kLen = aDataSort.length; k < kLen; k++) {
        iCol = aDataSort[k];
        sType = aoColumns[iCol].sType || 'string';

        if (nestedSort[i]._idx === undefined) {
          nestedSort[i]._idx = aoColumns[iCol].asSorting.indexOf(
            nestedSort[i][1]
          );
        }

        if (nestedSort[i][1]) {
          aSort.push({
            src: srcCol,
            col: iCol,
            dir: nestedSort[i][1],
            index: nestedSort[i]._idx,
            type: sType,
            formatter: extSort[sType + '-pre'],
            sorter: extSort[sType + '-' + nestedSort[i][1]],
          });
        }
      }
    }
  }

  return aSort;
}

export function _fnSortResolve(settings, nestedSort, sort) {
  var push = function (a) {
    if (_isPlainObject(a)) {
      if (a.idx !== undefined) {
        // Index based ordering
        nestedSort.push([a.idx, a.dir]);
      } else if (a.name) {
        // Name based ordering
        var cols = _pluck(settings.aoColumns, 'sName');
        var idx = cols.indexOf(a.name);

        if (idx !== -1) {
          nestedSort.push([idx, a.dir]);
        }
      }
    } else {
      // Plain column index and direction pair
      nestedSort.push(a);
    }
  };

  if (_isPlainObject(sort)) {
    // Object
    push(sort);
  } else if (sort.length && typeof sort[0] === 'number') {
    // 1D array
    push(sort);
  } else if (sort.length) {
    // 2D array
    for (var z = 0; z < sort.length; z++) {
      push(sort[z]); // Object or array
    }
  }
}
