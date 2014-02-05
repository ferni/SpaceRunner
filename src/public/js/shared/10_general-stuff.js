/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module, exports*/

var sh = require('./09_shared-class'), _ = sh._,
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

    sh.Player = sh.Jsonable.extendShared({
        init: function(json) {
            this.set('Player', ['id', 'name'], json);
        }
    });

    /**
     * Vector math.
     * @type {{sub: Function, add: Function, mul: Function, div: Function, equal: Function}}
     */
    sh.v = {
        sub: function(v1, v2) {
            return { x: v1.x - v2.x, y: v1.y - v2.y };
        },
        add: function(v1, v2) {
            return { x: v1.x + v2.x, y: v1.y + v2.y };
        },
        mul: function(v, scalar) {
            return { x: v.x * scalar, y: v.y * scalar};
        },
        div: function(v, scalar) {
            return { x: v.x / scalar, y: v.y / scalar};
        },
        equal: function(v1, v2) {
            return v1.x === v2.x && v1.y === v2.y;
        },
        map: function(v, fun) {
            return {x: fun(v.x), y: fun(v.y)};
        },
        str: function(v) {
            return '(' + v.x + ', ' + v.y + ')';
        },
        distance: function(v1, v2) {
            return Math.sqrt(Math.pow(v2.x - v1.x, 2) +
                Math.pow(v2.y - v1.y, 2));
        }
    };

    sh.tiles = {
        solid: 's',
        front: 'f',
        back: 'b',
        clear: '.'
    };

    sh.mapNames = [
        'test',
        'cyborg_battleship1',
        'cyborg_cruiser',
        'cyborg_drone',
        'cyborg_frigate',
        'humanoid_battleship',
        'humanoid_cruiser',
        'humanoid_drone',
        'humanoid_frigate',
        'liquid_battleship',
        'liquid_cruiser',
        'liquid_drone',
        'liquid_frigate',
        'mechanoid_battleship',
        'mechanoid_cruiser',
        'mechanoid_drone',
        'mechanoid_frigate'
    ];

    //Object holding references to functions that will be tested.
    sh.forTesting = {};

    //used in testing
    sh.getProperties = function(object) {
        var props = [], p;
        for (p in object) {
            if (object.hasOwnProperty(p)) {
                props.push(p);
            }
        }
        return props;
    };
}(sh));

