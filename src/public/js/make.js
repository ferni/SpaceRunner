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
    var api = {};

    //ITEMS

    api.itemTypes = {
        weapon: WeaponItem,
        engine: EngineItem,
        power: PowerItem,
        console: ConsoleItem,
        component: ComponentItem,
        door: DoorItem,
        wall: WallItem
    };
    api.item = function(type, params){
        var Constructor;
        Constructor = api.itemTypes[type];
        if (!Constructor) {
            console.warn("No such item type '" + type +
                "' (utils.makeItem)");
            return null;
        }
        if(params) {
            return new Constructor(params[0], params[1], params[2]);
        } else {
            return new Constructor(-100, -100, {});
        }

    };
    api.itemFromJson = function(json){
        var item = api.item(json.type, [json.x, json.y, json.settings]);
        item.rotated(json.rotated);
        return item;
    };

    //UNITS
    api.unitFromJson = function(json) {
        return new Unit(json.x, json.y, json.settings);
    };
    return api;
})();