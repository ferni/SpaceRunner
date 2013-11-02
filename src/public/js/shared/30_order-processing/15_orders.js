/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module*/
var sh = require('../30_order-processing/10_actions'), _ = sh._;
if (typeof exports !== 'undefined') {
    /**
     * exports from NodeJS
     * @type {*}
     */
    sh = module.exports = sh;
}

(function() {
    'use strict';
    var Order;
    Order = sh.SharedClass.extendShared({
        execute: function(time) {
            return null;
        },
        conditionsOK: function() {
            return true;
        }
    });

    sh.orders = {};
    sh.orders.Move = Order.extendShared({
        init: function(json) {
            this.unit = json.unit;
            this.ship = json.ship;
            this.from = json.from;
            this.to = json.to;
        },
        execute: function(time) {
            if (this.conditionsOK()) {
                return new sh.actions.Move({
                    time: time,
                    unitID: this.unit.id,
                    from: this.from,
                    to: this.to,
                    duration: this.unit.getTimeForMoving(this.from, this.to)
                });
            }
            return null;
        },
        conditionsOK: function() {
            //there's no unit ahead
            return this.ship.unitsMap.at(this.to.x, this.to.y) === 0;
        }
    });
}());
