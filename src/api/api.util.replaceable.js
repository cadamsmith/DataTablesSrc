var _max_str_len = Math.pow(2, 28);

/**
 * Util functions that can be replaced by the user
 */
export const _dt_util_replaceable = {
  normalize: function (str, both) {
    if (typeof str !== "string") {
      return str;
    }

    // It is faster to just run `normalize` than it is to check if
    // we need to with a regex! (Check as it isn't available in old
    // Safari)
    var res = str.normalize ? str.normalize("NFD") : str;

    // Equally, here we check if a regex is needed or not
    return res.length !== str.length
      ? (both === true ? str + " " : "") + res.replace(/[\u0300-\u036f]/g, "")
      : res;
  },

  stripHtml: function (input) {
    if (!input || typeof input !== "string") {
      return input;
    }

    // Irrelevant check to workaround CodeQL's false positive on the regex
    if (input.length > _max_str_len) {
      throw new Error("Exceeded max str len");
    }

    var previous;

    input = input.replace(_re_html, ""); // Complete tags

    // Safety for incomplete script tag - use do / while to ensure that
    // we get all instances
    do {
      previous = input;
      input = input.replace(/<script/i, "");
    } while (input !== previous);

    return previous;
  },

  escapeHtml: function (d) {
    if (Array.isArray(d)) {
      d = d.join(",");
    }

    return typeof d === "string"
      ? d
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
      : d;
  },
};
