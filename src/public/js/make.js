/*
 -*- coding: utf-8 -*-
 * vim: set ts=4 sw=4 et sts=4 ai:
 * Copyright 2013 MITHIS
 * All rights reserved.
 */

/**
 * Factories for entities
 */
var make = (function(){
    var api = {};
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

    return api;
})();