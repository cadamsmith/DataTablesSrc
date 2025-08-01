// Can be assigned in DateTable.use() - note luxon and moment vars are in helpers.js
var __bootstrap;
var __foundation;
var __luxon; // Can be assigned in DateTable.use()
var __moment; // Can be assigned in DateTable.use()

export function _dt_getLib(type) {
  switch (type) {
    case 'bootstrap':
      return __bootstrap;
    case 'foundation':
      return __foundation;
    case 'luxon':
      return __luxon;
    case 'moment':
      return __moment;
    default:
      return null;
  }
}

export function _dt_setLib(type, newValue) {
  switch (type) {
    case 'bootstrap':
      __bootstrap = newValue;
      break;
    case 'foundation':
      __foundation = newValue;
      break;
    case 'luxon':
      __luxon = newValue;
      break;
    case 'moment':
      __moment = newValue;
      break;
    default:
      break;
  }
}
