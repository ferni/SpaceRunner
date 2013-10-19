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
        weapon: sh.items.Weapon,
        engine: sh.items.Engine,
        power: sh.items.Power,
        console: sh.items.Console,
        component: sh.items.Component,
        door: sh.items.Door,
        wall: sh.items.Wall,
        weak_spot: sh.items.WeakSpot
    };

    make.itemModel = function(type, params) {
        var Constructor;
        Constructor = make.itemModels[type];
        if (!Constructor) {
            console.warn("No such item type '" + type +
                "' (utils.makeItem)");
            return null;
        }
        if (params) {
            return new Constructor(params[0], params[1], params[2]);
        }
        return new Constructor(null, 0, 0);
    };

    make.itemFromJson = function(json) {
        var item = make.itemModel(json.type,
            [null, parseInt(json.x, 10), parseInt(json.y, 10)]);
        item.rotated(json.r);
        return item;
    };

    //UNITS
    make.unitFromJson = function(json) {
        return new sh.Unit(parseInt(json.x, 10), parseInt(json.y, 10),
            json.settings);
    };
    make.playerFromJson = function(json) {
        return new sh.Player(json);
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
