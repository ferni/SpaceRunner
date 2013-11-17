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
            if (this.conditionsOK(time)) {
                return new sh.actions.Move({
                    time: time,
                    unitID: this.unit.id,
                    from: this.from,
                    to: this.to,
                    duration: this.unit.getTimeForMoving(this.from, this.to,
                        this.ship)
                });
            }
            return null;
        },
        conditionsOK: function(time) {
            var self = this,
                units = this.ship.unitsMap.at(this.to.x, this.to.y),
                arrivalTime = time +
                    this.unit.getTimeForMoving(this.from, this.to, this.ship);
            return (!units || //there's no unit ahead
                _.all(units, function(u) { //or...
                    //it's from a different team
                    return u.ownerID !== self.unit.ownerID ||
                        //or it's going away
                            (u.moving &&
                            !_.isEqual(u.moving.dest, self.to) &&
                            u.moving.arrivalTime <= arrivalTime
                            );
                })) &&

                !_.any(self.ship.getPlayerUnits(self.unit.ownerID),
                    function(u) {
                        //no unit is moving there
                        return (u.moving &&
                            _.isEqual(u.moving.dest, self.to)) ||
                        //no unit with higher rank has prepared to move there
                            (u.id > self.unit.id &&
                                u.orderState === 'prepared' &&
                                _.isEqual(u.orders[0].to, self.to));
                    });
        }
    });
}());
