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
    var make = {}, p;

    //ITEMS VMS
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
            model = sh.make.itemModel(type,
                [null, params ? params[0] : 0, params ? params[1] : 0]);
        Constructor = make.itemTypes[type];
        if (!Constructor) {
            console.warn("No such item type '" + type +
                "' (utils.makeItem)");
            return null;
        }
        return new Constructor(model);
    };
    /**
     *
     * @param itemModel {sh.Item} the item.
     */
    make.vm = function(itemModel) {
        var VMConstructor = make.itemTypes[itemModel.type];
        if (!VMConstructor) {
            throw 'Could not find view model of type ' + itemModel.type;
        }
        return new VMConstructor(itemModel);
    };


    //add props from sh.make checking that none are being overwritten.
    for(p in sh.make){
        if(sh.make.hasOwnProperty(p)){
            if(typeof make[p] !== 'undefined'){
                console.error('Attempted to overwrite property "' + p +
                    '" in sh.make');
            }else{
                make[p] = sh.make[p];
            }
        }
    }
    return make;
})();