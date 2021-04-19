/*jslint nomen: true */
/*global mx, mxui, mendix, dojo, require, console, define, module */

define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",
    "dijit/_TemplatedMixin",
    "mxui/dom",
    "dojo/dom",
    "dojo/query",
    "dojo/dom-prop",
    "dojo/dom-geometry",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/on",
    "dojo/_base/lang",
    "dojo/text",
    "dojo/_base/array",
    "dojo/dom-construct",
    "dojo/text!CheckboxSelector/widget/template/CheckboxSelector.html",
    "dojo/NodeList-traverse"
], function (declare, _WidgetBase, _TemplatedMixin, domMx, dom, domQuery, domProp, domGeom, domClass, domStyle, on, lang, text, array, domConstruct, widgetTemplate) {
    "use strict";

    return declare("CheckboxSelector.widget.checkboxselector", [_WidgetBase, _TemplatedMixin], {

        templateString: widgetTemplate,

        _contextObj: null,
        _handles: null,
        _selectAllBox: null,
        _readonly: false,
        _firstTh: null,
        _referencePath: null,

        postCreate: function () {
            console.debug(this.id + ".postCreate");
            this._handles = [];

            this._setupWidget();
        },

        update: function (obj, callback) {
            console.debug(this.id + ".update");
            this._contextObj = obj;

            if (this._contextObj && this._contextObj.getGuid() && this.displayAttrs.length > 0) {
                domStyle.set(this.domNode, "visibility", "visible");
                this._readonly = this._contextObj.isReadonlyAttr(this._referencePath);

                // Subscribe to object updates.
                this._resetSubscriptions();
                this._loadData(callback);
            } else {
                // No data no show
                domStyle.set(this.domNode, "visibility", "hidden");
                if(this.displayAttrs.length === 0){
                    console.error(this.friendlyId + ": Missing 'Display attributes', please check the Display tab in the widget configuration.");
                }
                if (callback) callback();
            }
        },

        _setupWidget: function () {
            console.debug(this.id + "._setupWidget");
            this._referencePath = this.reference.split("/")[0];
            this._firstTh = domQuery(".first-th", this.domNode)[0];

            if (this.addSelectAll) {
                this._selectAllBox = domConstruct.create("input", {
                    type: "checkbox"
                });

                domConstruct.place(this._selectAllBox, this._firstTh);

                //Add the onclick event on the SelectAll checkbox
                on(this._selectAllBox, "click", lang.hitch(this, function (event) {
                    var tbody = domQuery("tbody", this.domNode)[0];
                    //toggle all checkboxes when the row is clicked
                    this._selectAllBoxes(domQuery("input", tbody));
                }));
            }

        },

        // Attach events to newly created nodes.
        _setupEvents: function () {
            console.debug(this.id + "._setupEvents");
            if (!this.readOnly && !this._readonly) {
                on(domQuery("tbody tr", this.domNode), "click", lang.hitch(this, function (event) {
                    if (event.target.tagName.toUpperCase() === "INPUT") {
                        //Evaluate if the value of the select all box needs to change
                        this._evaluateSelectAllBox( event.target );

                        this._setReference(event.target);
                        this._execMf(this.onChangeMf, this._contextObj.getGuid());
                    } else {
                        var row = domQuery(event.target).parent()[0];
                        //toggle the checkbox when the row is clicked
                        this._toggleCheckboxes(domQuery("input", row));
                    }
                }));
            } else {
                this._setDisabled(domQuery("input", this.domNode));
            }
        },

        /**
         * Interaction widget methods.
         * ======================
         */
        _loadData: function (callback) {
            console.debug(this.id + "._loadData");

            if (this._contextObj && this._contextObj.getGuid()) {
                this._clearValidations();

                //default fetch
                var refEntity = this.reference.split("/")[1],
                    filters = {},
                    xpath = "//" + refEntity;

                filters.sort = [[this.sortAttr, this.sortOrder]];
                if (this.limit > 0) {
                    filters.amount = this.limit;
                }
                if (this.constraint) {
                    xpath = "//" + refEntity + this.constraint.replace(/\[%CurrentObject%\]/g, this._contextObj.getGuid());
                }
                mx.data.get({
                    xpath: xpath,
                    filter: filters,
                    callback: lang.hitch(this, function(objs) {
                        this._fetchData(objs, callback);
                    }),
                    error: lang.hitch(this, function(err) {
                        console.error(this.id + "_loadData get failed: " + err.toString());
                        if (callback) callback();
                    })
                });
            } else {
                if (callback) callback();
            }
        },

        _setAsReference: function (guid) {
            console.debug(this.id + "._setAsReference");
            this._contextObj.addReferences(this._referencePath, [guid]);
        },

        _execMf: function (mf, guid, cb) {
            console.debug(this.id + "._execMf");
            if (mf && guid) {
                mx.data.action({
                    params: {
                        applyto: "selection",
                        actionname: mf,
                        guids: [guid]
                    },
                    store: {
                        caller: this.mxform
                    },
                    callback: lang.hitch(this, function (objs) {
                        if (cb && typeof cb === "function") {
                            cb(objs);
                        }
                    }),
                    error: function (error) {
                        console.debug(error.description);
                    }
                }, this);
            }
        },

        /**
         * Fetching Data & Building widget
         * ======================
         */
        _buildTemplate: function (rows, headers, callback) {
            console.debug(this.id + "._buildTemplate");

            if (!this._contextObj || !this._contextObj.getGuid()){
                if (callback) callback();
            }

            var tbody = domQuery("tbody", this.domNode)[0],
                thead = domQuery("thead tr", this.domNode)[0];

            domConstruct.empty(tbody);
            domConstruct.place(this._firstTh, thead, "first");

            for (var i = 0; i < headers.length; i++) {
                var headerPos = i + 1;

                if (thead.children.length > headerPos) {
                    thead.children[headerPos].innerHTML = headers[i];
                } else {
                    var th = domConstruct.create("th", {
                        innerHTML: headers[i]
                    });
                    domConstruct.place(th, thead, "last");
                }
            }

            array.forEach(rows, lang.hitch(this, function (rowData) {
                var row = domConstruct.create("tr", {
                        id: this.domNode.id + "_" + rowData.id
                    }),
                    checkboxtd = domConstruct.create("td"),
                    input = domConstruct.create("input", {
                        type: "checkbox",
                        value: rowData.id
                    });

                domConstruct.place(input, checkboxtd);
                domConstruct.place(checkboxtd, row);

                array.forEach(rowData.data, function (value) {
                    var td = domConstruct.create("td", {
                        innerHTML: value
                    });
                    domConstruct.place(td, row, "last");
                });
                domConstruct.place(row, tbody);

            }));

            this._setReferencedBoxes(this._contextObj.getReferences(this.reference.split("/")[0]));

            this._setupEvents();

            if (callback) callback();
        },

        _fetchData: function (objs, callback) {
            console.debug(this.id + "._fetchData");
            var data = [],
                finalLength = objs.length * this.displayAttrs.length;

            if (objs.length) {
                array.forEach(objs, lang.hitch(this, function (obj) {
                    array.forEach(this.displayAttrs, lang.hitch(this, function (attr, index) {
                        obj.fetch(attr.displayAttr, lang.hitch(this, function (value) {
                            if (typeof value === "string") {
                                value = mxui.dom.escapeString(value);
                                value = value.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, " Warning! Script tags not allowed. ");
                            }
                            if (attr.currency !== "None") {
                                value = this._parseCurrency(value, attr);
                            }

                            data.push({
                                "obj": obj.getGuid(),
                                "index": index,
                                "value": value,
                                "header": attr.header
                            });
                            if (data.length === finalLength) {
                                this._processData(data, callback);
                            }
                        }));
                    }));
                }));
            } else {
                if (callback) callback();
            }
        },

        _processData: function (data, callback) {
            console.debug(this.id + "._processData");
            var rowObjs = [],
                rows = [],
                headers = [];

            //filter doubles
            array.forEach(data, function (item) {
                if (array.indexOf(rowObjs, item.obj) === -1) {
                    rowObjs.push(item.obj);
                }
            });

            array.forEach(rowObjs, function (obj) {
                var rowData = [],
                    row = {};
                row.id = obj;
                array.forEach(data, function (item) {
                    if (obj === item.obj) {
                        rowData.splice(item.index, 0, item.value);
                        if (array.indexOf(headers, item.header) === -1) {
                            headers.splice(item.index, 0, item.header);
                        }
                    }
                });
                row.data = rowData;
                array.forEach(headers, function (header) {
                    if (obj === header.id) {
                        row.header = header.header;
                    }
                });
                rows.push(row);
            });
            this._buildTemplate(rows, headers, callback);
        },

        /**
         * Checkbox functionality
         * ======================
         */
        _toggleCheckboxes: function (boxes) {
            console.debug(this.id + "._toggleCheckboxes");
            array.forEach(boxes, lang.hitch(this, function(node) {
                this._toggleCheckbox(node);
            }));

            this._setReferences(boxes);
        },

        _toggleCheckbox: function (box) {
            console.debug(this.id + "._toggleCheckbox");
            if (box.checked) {
                box.checked = false;
                this._evaluateSelectAllBox( box );
            } else {
                box.checked = true;
            }
        },

        /**
         * Evaluate if the value of the select all box needs to change
         */
        _evaluateSelectAllBox: function ( box ) {
            console.debug(this.id + "._evaluateSelectAllBox");
            if( box.checked === false ) {
                if (this.addSelectAll && this._selectAllBox.checked)
                    this._selectAllBox.checked = false;
            }
        },

        _setDisabled: function (boxes) {
            console.debug(this.id + "._setDisabled");
            array.forEach(boxes, function (box) {
                box.disabled = true;
            });
        },

        _selectAllBoxes: function (boxes) {
            console.debug(this.id + "._selectAllBoxes");
            array.forEach(boxes, lang.hitch(this, function (box) {
                if (this._selectAllBox.checked) {
                    box.checked = true;
                } else {
                    box.checked = false;
                }
                this._setReference(box);
            }));
        },

        _setReferences: function (boxes) {
            console.debug(this.id + "._setReferences");
            boxes.forEach( lang.hitch(this, function (box) {
                this._setReference(box);
            }));

            this._execMf(this.onChangeMf, this._contextObj.getGuid());
        },

        _setReference : function (box) {
            console.debug(this.id + "._setReference");
            if (box.checked) {
                this._setAsReference(box.value);
            } else {
                this._contextObj.removeReferences(this._referencePath, box.value);
            }
        },

        /**
         * Helper functions
         * ======================
         */

        _setReferencedBoxes: function (guids) {
            console.debug(this.id + "._setReferencedBoxes");
            var inputNodes = domQuery("input[value]", this.domNode);

            array.forEach(inputNodes, lang.hitch(this, function(inputNode) {
                if(guids.indexOf(inputNode.value) > -1) {
                    inputNode.checked = true;
                }
                else if(inputNode.checked === true) {
                    inputNode.checked = false;
                    this._evaluateSelectAllBox(inputNode);
                }
            }));
        },

        _parseCurrency: function (value, attr) {
            console.debug(this.id + "._parseCurrency");
            var currency = value;
            switch (attr.currency) {
            case "Euro":
                currency = "&#8364 " + mx.parser.formatValue(value, "currency", {
                    places: attr.decimalPrecision
                });
                break;
            case "Dollar":
                currency = "&#36 " + mx.parser.formatValue(value, "currency", {
                    places: attr.decimalPrecision
                });
                break;
            case "Yen":
                currency = "&#165 " + mx.parser.formatValue(value, "currency", {
                    places: attr.decimalPrecision
                });

                break;
            case "Pound":
                currency = "&#163 " + mx.parser.formatValue(value, "currency", {
                    places: attr.decimalPrecision
                });

                break;
            default:
                console.debug("Error: Currency type not found");
                break;
                // type not found
            }
            return currency;
        },

        _checkValue: function (obj, value, attr) {
            //TODO: ENUM captions
        },

        _resetSubscriptions: function () {
            console.debug(this.id + "._resetSubscriptions");
            var entHandle = null,
                objHandle = null,
                attrHandle = null,
                validationHandle = null;

            // Release handles on previous object, if any.
            if (this._handles) {
                this._handles.forEach(function (handle, i) {
                    mx.data.unsubscribe(handle);
                });
            }

            if (this._contextObj) {
                entHandle = this.subscribe({
                    entity: this.reference.split("/")[1],
                    callback: lang.hitch(this, function () {
                        this._loadData();
                    })
                });

                objHandle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    callback: lang.hitch(this, function (guid) {
                        this._loadData();
                    })
                });

                attrHandle = this.subscribe({
                    guid: this._contextObj.getGuid(),
                    attr: this.reference.split("/")[0],
                    callback: lang.hitch(this, function (guid, attr, attrValue) {

                        this._setReferencedBoxes(attrValue);
                    })
                });

                validationHandle = mx.data.subscribe({
                    guid: this._contextObj.getGuid(),
                    val: true,
                    callback: lang.hitch(this, this._handleValidation)
                });

                this._handles = [entHandle, objHandle, attrHandle, validationHandle];
            }
        },

        _handleValidation: function (validations) {
            console.debug(this.id + "._handleValidation");

            this._clearValidations();

            var val = validations[0],
                msg = val.getReasonByAttribute(this.reference.split("/")[0]);

            if (this.readOnly) {
                val.removeAttribute(this.reference.split("/")[0]);
            } else {
                if (msg) {
                    this._addValidation(msg);
                    val.removeAttribute(this.reference.split("/")[0]);
                }
            }
        },

        _clearValidations: function () {
            console.debug(this.id + "._clearValidations");
            domConstruct.destroy(this._alertdiv);
        },

        _addValidation: function (msg) {
            console.debug(this.id + "._addValidation");
            this._alertdiv = domConstruct.create("div", {
                class: "alert alert-danger",
                innerHTML: msg
            });

            this.domNode.appendChild(this._alertdiv);
        }
    });
});

require(["CheckboxSelector/widget/checkboxselector"], function () {
    "use strict";
});
