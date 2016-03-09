/*jslint nomen: true */
/*global mx, mxui, mendix, dojo, require, console, define, module */

require([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "CheckboxSelector/widget/checkboxselector"
], function (declare, lang, _checkboxWidget) {
    "use strict";

    return declare("CheckboxSelector.widget.checkboxselectormf", [_checkboxWidget], {

        _loadData: function () {
            logger.debug(this.id + "._loadData");
            this._clearValidations();
            this._execMf(this.datasourcemf, this._contextObj.getGuid(), lang.hitch(this, this._fetchData));
        }

    });
});
