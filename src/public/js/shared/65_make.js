/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, require, exports, module*/

var sh = require('./63_units'), _ = sh._;
if (typeof exports !== 'undefined') {
    /**
     * exports from NodeJS
     * @type {*}
     */
    sh = module.exports = sh;
}

/**
 * Factories.
 */
sh.make = (function() {
    'use strict';
    var make = {};

    //ITEMS
    make.itemModels = {
        Weapon: sh.items.Weapon,
        Engine: sh.items.Engine,
        Power: sh.items.Power,
        Console: sh.items.Console,
        Component: sh.items.Component,
        Door: sh.items.Door,
        Wall: sh.items.Wall,
        WeakSpot: sh.items.WeakSpot
    };

    make.itemModel = function(type, json) {
        var Constructor;
        Constructor = make.itemModels[type];
        if (!Constructor) {
            console.warn("No such item type '" + type +
                "' (utils.makeItem)");
            return null;
        }
        return new Constructor(json);
    };

    make.moveOrder = function(unit, destination) {
        return {
            type: 'Order-JSON-V1',
            variant: 'move',
            unitID: unit.id,
            destination: {
                x: destination.x,
                y: destination.y
            }
        };
    };

    return make;
}());
