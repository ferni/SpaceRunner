/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module*/

var sh = require('../25_classes/10_shared-class'), _ = sh._,
    PF = sh.PF;
if (typeof exports !== 'undefined') {
    /**
     * exports from NodeJS
     * @type {*}
     */
    sh = module.exports = sh;
}

(function(sh) {
    'use strict';
    //SHARED ENTITIES

    /**
     * The grid gets subdivided in its width and its height according to this
     * constant.
     * @type {number}
     */
    sh.GRID_SUB = 2;

    sh.TestSharedEntity = sh.SharedClass.extendShared({});

    sh.Jsonable = sh.SharedClass.extendShared({
        _properties: [],
        /**
         * Sets the properties found in the json param to the object.
         * This properties are later used by toJson to return the json form
         * of the object.
         * @param {Array} properties An array of properties to be set and
         * returned in toJson.
         * @param {Object} json The json object.
         * @param {String} type The name of the constructor.
         */
        set: function(type, properties, json) {
            if (!json) {
                json = {};
            }
            this.type = type;
            this._properties = this._properties.concat(properties);
            _.each(properties, function(p) {
                if (json[p] === undefined) {
                    return;
                }
                //workaround for nodejs converting numbers in a
                //json string to string when the client sends it to
                // the server.
                //TODO: remove when socket.io is implemented (if it doesn't
                // have this problem)
                if (json._numbers && _.isString(json[p]) &&
                    _.contains(json._numbers, p)) {
                    this[p] = parseFloat(json[p]);
                } else {
                    this[p] = json[p];
                }


            }, this);
        },
        toJson: function() {
            var json = {
                _numbers: [],
                type: this.type
            };
            _.each(this._properties, function(p) {
                json[p] = this[p];
                if (_.isNumber(this[p])) {
                    json._numbers.push(p);
                }
            }, this);
            return json;
        }
    });
}(sh));
