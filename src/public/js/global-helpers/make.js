/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global WeaponVM, EngineVM, PowerVM, ConsoleVM, ComponentVM, DoorVM, WallVM,
sh, Unit*/

/**
 * Factories for entities
 */
var make = (function() {
    'use strict';
    var make = {}, p;

    //ITEMS VMS
    make.itemTypes = {
        weapon: WeaponVM,
        engine: EngineVM,
        power: PowerVM,
        console: ConsoleVM,
        component: ComponentVM,
        door: DoorVM,
        wall: WallVM
    };
    make.item = function(type, params) {
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
     * @param {sh.Item} model the item.
     */
    make.vm = function(model) {
        var VMConstructor;
        if (model instanceof sh.Item) {
            VMConstructor = make.itemTypes[model.type];
        } else if (model instanceof sh.Unit) {
            VMConstructor = Unit;
        } else {
            throw 'Model not valid.';
        }
        if (!VMConstructor) {
            throw 'Could not find view model of type ' + model.type;
        }
        return new VMConstructor(model);
    };

    //add props from sh.make checking that none are being overwritten.
    for (p in sh.make) {
        if (sh.make.hasOwnProperty(p)) {
            if (make[p] !== undefined) {
                console.error('Attempted to overwrite property "' + p +
                    '" in sh.make');
            } else {
                make[p] = sh.make[p];
            }
        }
    }
    return make;
}());
