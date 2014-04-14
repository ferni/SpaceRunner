/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module, exports*/

var sh = require('./00_init'), _ = sh._,
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
    /**
     * The grid gets subdivided in its width and its height according to this
     * constant.
     * @type {number}
     */
    sh.GRID_SUB = 2;


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
            if (!v1 || !v2) {
                return false;
            }
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

