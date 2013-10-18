/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, require, module, exports*/

var sh = require('../30_order-processing/20_script'), _ = sh._;
if (typeof exports !== 'undefined') {
    /**
     * NodeJS exports
     * @type {*}
     */
    sh = module.exports = sh;
}

/**
 * Verifies that the set of orders is valid.
 * @param {Object} order
 * @param {sh.Ship} ship
 * @param {int} playerID
 * @return {boolean}
 */
sh.verifyOrder = function(order, ship, playerID) {
    'use strict';
    if (!order || !order.type || order.type !== 'Order-JSON-V1' ||
            !order.variant) {
        return false;
    }
    switch (order.variant) {
    case 'move':
        var dest = order.destination,
            unit = ship.getUnitByID(order.unitID);
        return unit &&
            //is destination a walkable area
            ship.isWalkable(dest.x, dest.y) &&
            //unit owned by the issuer
            unit.ownerID === playerID;
    default:
        return false;
    }
};
