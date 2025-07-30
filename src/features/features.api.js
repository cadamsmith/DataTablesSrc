import { _dt_ext_feature, _dt_ext_features } from "../ext/ext.feature";
import { _constructFeature_div } from "./features.div";
import { _constructFeature_info } from "./features.info";
import { _constructFeature_page } from "./features.page";
import { _constructFeature_pageLength } from "./features.pageLength";
import { _constructFeature_search } from "./features.search";

const _dt_feature = {};

// Third parameter is internal only!
_dt_feature.register = function (name, cb, legacy) {
  _dt_ext_features[name] = cb;

  if (legacy) {
    _dt_ext_feature.push({
      cFeature: legacy,
      fnInit: cb,
    });
  }
};

export function _registerBuiltInFeatures() {
  _dt_feature.register("div", _constructFeature_div);
  _dt_feature.register("info", _constructFeature_info, "i");
  _dt_feature.register("search", _constructFeature_search, "f");
  _dt_feature.register("paging", _constructFeature_page, "p");
  _dt_feature.register("pageLength", _constructFeature_pageLength, "l");
}

export { _dt_feature };
