/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, require, module, exports*/

var sh = require('../30_order-processing/40_create-script'), _ = sh._;
if (typeof exports !== 'undefined') {
    /**
     * NodeJS exports
     * @type {*}
     */
    sh = module.exports = sh;
}

/**
 * Modifies the ship and its elements according with the script given
 * and the time.
 * @param {sh.Ship} ship
 * @param {Script} script
 */
sh.updateShipByScript = function(ship, script) {
    'use strict';
    _.each(script.actions, function(action) {
        if (script.isWithinTurn(action)) {
            action.applyChanges(ship);
        }
    });
    ship.itemsMap.update();
    ship.unitsMap.update();
};
