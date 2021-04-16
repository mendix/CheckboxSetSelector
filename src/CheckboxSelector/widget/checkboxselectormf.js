/*jslint nomen: true */
/*global mx, mxui, mendix, dojo, require, console, define, module */

require([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "CheckboxSelector/widget/checkboxselector"
], function (declare, lang, _checkboxWidget) {
    "use strict";

    return declare("CheckboxSelector.widget.checkboxselectormf", [_checkboxWidget], {

        _loadData: function (callback) {
            console.debug(this.id + "._loadData");
            if (this._contextObj && this._contextObj.getGuid()) {
                this._clearValidations();
                this._execMf(this.datasourcemf, this._contextObj.getGuid(), lang.hitch(this, function(objs) {
                    this._fetchData(objs, callback);
                }));
            } else {
                if (callback) callback();
            }
        }

    });
});

require(["CheckboxSelector/widget/checkboxselectormf"], function () {
    "use strict";
});
