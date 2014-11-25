/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module*/

var sh = module.exports,
    SharedClass = require('./10_shared-class').SharedClass,
    _ = require('underscore')._;

(function() {
    'use strict';
    sh.Jsonable = SharedClass.extendShared({
        _properties: [],
        /**
         * Sets the properties found in the json param to the object.
         * This properties are later used by toJson to return the json form
         * of the object.
         * @param {{type:string, properties:Array, json:Object}} settings
         */
        setJson: function (settings) {
            var type = settings.type,
                properties = settings.properties,
                json = settings.json;
            if (!json) {
                json = {};
            }
            this.type = type;
            this._properties = this._properties.concat(properties);
            _.each(properties, function (p) {
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
        toJson: function () {
            var json = {
                _numbers: [],
                type: this.type
            };
            _.each(this._properties, function (p) {
                json[p] = this[p];
                if (_.isNumber(this[p])) {
                    json._numbers.push(p);
                }
            }, this);
            return json;
        }
    });
}());
