/**
 * Version string for plug-ins to check compatibility. Allowed format is
 * `a.b.c-d` where: a:int, b:int, c:int, d:string(dev|beta|alpha). `d` is used
 * only for non-release builds. See https://semver.org/ for more information.
 *  @member
 *  @type string
 *  @default Version number
 */
export var _dt_version = "2.3.2";

/**
 * Provide a common method for plug-ins to check the version of DataTables being
 * used, in order to ensure compatibility.
 *
 *  @param {string} version Version string to check for, in the format "X.Y.Z".
 *    Note that the formats "X" and "X.Y" are also acceptable.
 *  @param {string} [version2=current DataTables version] As above, but optional.
 *   If not given the current DataTables version will be used.
 *  @returns {boolean} true if this version of DataTables is greater or equal to
 *    the required version, or false if this version of DataTales is not
 *    suitable
 *  @static
 *  @dtopt API-Static
 *
 *  @example
 *    alert( $.fn.dataTable.versionCheck( '1.9.0' ) );
 */
export var _dt_versionCheck = function (version, version2) {
  var aThis = version2 ? version2.split(".") : _dt_version.split(".");
  var aThat = version.split(".");
  var iThis, iThat;

  for (var i = 0, iLen = aThat.length; i < iLen; i++) {
    iThis = parseInt(aThis[i], 10) || 0;
    iThat = parseInt(aThat[i], 10) || 0;

    // Parts are the same, keep comparing
    if (iThis === iThat) {
      continue;
    }

    // Parts are different, return immediately
    return iThis > iThat;
  }

  return true;
};
