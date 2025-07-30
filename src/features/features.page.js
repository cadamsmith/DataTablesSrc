import { _range } from "../core/core.internal";
import { _extend } from "../core/core.jq";
import { _fnRenderer, _fnBindAction } from "../core/core.support";
import { _fnPageChange } from "../core/core.page";
import $ from "jquery";
import { _dt_ext_pagination, _pagingNumbers } from "../ext/ext.renderer";

// opts
// - type - button configuration
// - buttons - number of buttons to show - must be odd
export function _constructFeature_page(settings, opts) {
  // Don't show the paging input if the table doesn't have paging enabled
  if (!settings.oFeatures.bPaginate) {
    return null;
  }

  opts = _extend(
    {
      buttons: _dt_ext_pagination.numbers_length,
      type: settings.sPaginationType,
      boundaryNumbers: true,
      firstLast: true,
      previousNext: true,
      numbers: true,
    },
    opts
  );

  var host = $("<div/>")
    .addClass(
      settings.oClasses.paging.container +
        (opts.type ? " paging_" + opts.type : "")
    )
    .append(
      $("<nav>")
        .attr("aria-label", "pagination")
        .addClass(settings.oClasses.paging.nav)
    );
  var draw = function () {
    _pagingDraw(settings, host.children(), opts);
  };

  settings.aoDrawCallback.push(draw);

  // Responsive redraw of paging control
  $(settings.nTable).on("column-sizing.dt.DT", draw);

  return host;
}

/**
 * Dynamically create the button type array based on the configuration options.
 * This will only happen if the paging type is not defined.
 */
function _pagingDynamic(opts) {
  var out = [];

  if (opts.numbers) {
    out.push("numbers");
  }

  if (opts.previousNext) {
    out.unshift("previous");
    out.push("next");
  }

  if (opts.firstLast) {
    out.unshift("first");
    out.push("last");
  }

  return out;
}

function _pagingDraw(settings, host, opts) {
  if (!settings._bInitComplete) {
    return;
  }

  var plugin = opts.type ? _dt_ext_pagination[opts.type] : _pagingDynamic,
    aria = settings.oLanguage.oAria.paginate || {},
    start = settings._iDisplayStart,
    len = settings._iDisplayLength,
    visRecords = settings.fnRecordsDisplay(),
    all = len === -1,
    page = all ? 0 : Math.ceil(start / len),
    pages = all ? 1 : Math.ceil(visRecords / len),
    buttons = [],
    buttonEls = [],
    buttonsNested = plugin(opts).map(function (val) {
      return val === "numbers"
        ? _pagingNumbers(page, pages, opts.buttons, opts.boundaryNumbers)
        : val;
    });

  // .flat() would be better, but not supported in old Safari
  buttons = buttons.concat.apply(buttons, buttonsNested);

  for (var i = 0; i < buttons.length; i++) {
    var button = buttons[i];

    var btnInfo = _pagingButtonInfo(settings, button, page, pages);
    var btn = _fnRenderer(settings, "pagingButton")(
      settings,
      button,
      btnInfo.display,
      btnInfo.active,
      btnInfo.disabled
    );

    var ariaLabel =
      typeof button === "string"
        ? aria[button]
        : aria.number
          ? aria.number + (button + 1)
          : null;

    // Common attributes
    $(btn.clicker).attr({
      "aria-controls": settings.sTableId,
      "aria-disabled": btnInfo.disabled ? "true" : null,
      "aria-current": btnInfo.active ? "page" : null,
      "aria-label": ariaLabel,
      "data-dt-idx": button,
      tabIndex: btnInfo.disabled
        ? -1
        : settings.iTabIndex && btn.clicker[0].nodeName.toLowerCase() !== "span"
          ? settings.iTabIndex
          : null, // `0` doesn't need a tabIndex since it is the default
    });

    if (typeof button !== "number") {
      $(btn.clicker).addClass(button);
    }

    _fnBindAction(btn.clicker, { action: button }, function (e) {
      e.preventDefault();

      _fnPageChange(settings, e.data.action, true);
    });

    buttonEls.push(btn.display);
  }

  var wrapped = _fnRenderer(settings, "pagingContainer")(settings, buttonEls);

  var activeEl = host.find(document.activeElement).data("dt-idx");

  host.empty().append(wrapped);

  if (activeEl !== undefined) {
    host.find("[data-dt-idx=" + activeEl + "]").trigger("focus");
  }

  // Responsive - check if the buttons are over two lines based on the
  // height of the buttons and the container.
  if (buttonEls.length) {
    var outerHeight = $(buttonEls[0]).outerHeight();

    if (
      opts.buttons > 1 && // prevent infinite
      outerHeight > 0 && // will be 0 if hidden
      $(host).height() >= outerHeight * 2 - 10
    ) {
      _pagingDraw(
        settings,
        host,
        _extend({}, opts, { buttons: opts.buttons - 2 })
      );
    }
  }
}

/**
 * Get properties for a button based on the current paging state of the table
 *
 * @param {*} settings DT settings object
 * @param {*} button The button type in question
 * @param {*} page Table's current page
 * @param {*} pages Number of pages
 * @returns Info object
 */
function _pagingButtonInfo(settings, button, page, pages) {
  var lang = settings.oLanguage.oPaginate;
  var o = {
    display: "",
    active: false,
    disabled: false,
  };

  switch (button) {
    case "ellipsis":
      o.display = "&#x2026;";
      break;

    case "first":
      o.display = lang.sFirst;

      if (page === 0) {
        o.disabled = true;
      }
      break;

    case "previous":
      o.display = lang.sPrevious;

      if (page === 0) {
        o.disabled = true;
      }
      break;

    case "next":
      o.display = lang.sNext;

      if (pages === 0 || page === pages - 1) {
        o.disabled = true;
      }
      break;

    case "last":
      o.display = lang.sLast;

      if (pages === 0 || page === pages - 1) {
        o.disabled = true;
      }
      break;

    default:
      if (typeof button === "number") {
        o.display = settings.fnFormatNumber(button + 1);

        if (page === button) {
          o.active = true;
        }
      }
      break;
  }

  return o;
}
