/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global itemVMs, sh, UnitVM, unitVMs, orderVMs*/

/**
 * Factories for entities
 */
var make = (function() {
    'use strict';
    var make = {}, p;

    make.item = function(type, params) {
        var Constructor,
            model = sh.make.itemModel(type,
                {x: params ? params[0] : 0, y: params ? params[1] : 0});
        Constructor = itemVMs[type];
        if (!Constructor) {
            console.warn("No such item type '" + type +
                "' (utils.makeItem)");
            return null;
        }
        return new Constructor(model);
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
