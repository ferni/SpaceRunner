/*
 -*- coding: utf-8 -*-
 * vim: set ts=4 sw=4 et sts=4 ai:
 * Copyright 2013 MITHIS
 * All rights reserved.
 */

/**
 * Factories for entities
 */
var make = (function() {
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
        wall: sh.items.Wall
    };

    make.itemModel = function(type, params) {
        var Constructor;
        Constructor = make.itemModels[type];
        if (!Constructor) {
            console.warn("No such item type '" + type +
                "' (utils.makeItem)");
            return null;
        }
        if(params) {
            return new Constructor(params[0], params[1], params[2]);
        } else {
            return new Constructor(null, 0, 0);
        }
    };

    make.itemTypes = {
        weapon: WeaponItem,
        engine: EngineItem,
        power: PowerItem,
        console: ConsoleItem,
        component: ComponentItem,
        door: DoorItem,
        wall: WallItem
    };
    make.item = function(type, params){
        var Constructor,
            model = make.itemModel(type,
                [null, params ? params[0] : 0, params ? params[1] : 0]);
        Constructor = make.itemTypes[type];
        if (!Constructor) {
            console.warn("No such item type '" + type +
                "' (utils.makeItem)");
            return null;
        }
        return new Constructor(model);
    };
    make.itemFromJson = function(json){
        var item = make.item(json.type, [json.x, json.y, json.settings]);
        item.rotated(json.rotated);
        return item;
    };


    //UNITS
    make.unitFromJson = function(json) {
        return new Unit(json.x, json.y, json.settings);
    };
    return make;
})();