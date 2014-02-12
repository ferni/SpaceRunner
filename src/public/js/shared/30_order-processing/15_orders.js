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
    var pathfinder = new sh.PF.AStarFinder({
            allowDiagonal: true,
            dontCrossCorners: true
        });
    function state(order, finished, actions) {
        order.finished = finished;
        return {
            actions: actions,
            finished: finished
        };
    }

    sh.Order = sh.Jsonable.extendShared({
        init: function(json) {
            this.set('Order', ['unitID'], json);
            this.finished = false;
        }
    });

    sh.OrderPackage = sh.SharedClass.extendShared({
        orders: {},
        init: function(orders) {
            this.orders = orders;
        },
        toJson: function() {
            var ordersJson = {};
            _.each(this.orders, function(unitsOrders) {
                var unitID;
                if (unitsOrders.length === 0) {
                    return;
                }
                unitID = unitsOrders[0].unitID;
                ordersJson[unitID] = _.map(unitsOrders, function(order) {
                    return order.toJson();
                });
            });
            return {
                type: 'OrderPackage',
                orders: ordersJson
            };
        },
        fromJson: function(json) {
            var self = this;
            if (json.type !== 'OrderPackage') {
                throw 'OrderPackage json is of invalid type';
            }
            this.orders = {};
            _.each(json.orders, function(unitsOrders) {
                var unitID;
                if (unitsOrders.length === 0) {
                    return;
                }
                unitID = unitsOrders[0].unitID;
                self.orders[unitID] = _.map(unitsOrders, function(orderJson) {
                    return new sh.orders[orderJson.type](orderJson);
                });
            });
            return this;
        }
    });

    sh.orders = {};
    sh.orders.Move = sh.Order.extendShared({
        init: function(json) {
            this.parent(json);
            //in case its a me.Vector2D
            json.destination = {x: json.destination.x,
                y: json.destination.y};
            this.set('Move', ['destination'], json);
        },
        /**
         * Returns the actions and if the order is
         * finished or not.
         * @param {int} time
         * @param {sh.Ship} ship
         * @return {{actions:{Array}, finished:{Boolean}}
         */
        getState: function(time, ship) {
            var unit, dest = this.destination, nextTile, from;
            if (this.finished) {
                throw 'Order was already finished';
            }
            unit = ship.getUnitByID(this.unitID);
            if (sh.v.equal(unit, this.destination)) {
                //unit is already at destination
                return state(this, true, []);
            }
            if (unit.moving) {
                return state(this, false, []);
            }
            if (unit.moveLock) {
                from = {x: unit.x,
                    y: unit.y};
                return state(this, this.pathIndex >= this.path.length - 1,
                    [new sh.actions.Move({
                        time: time,
                        unitID: unit.id,
                        from: from,
                        to: unit.moveLock,
                        duration: unit.getTimeForMoving(from, unit.moveLock,
                            ship)
                    })]);
            }
            if (!this.path) {
                //find a path towards the destination
                if (!this.grid) {
                    this.grid = new sh.PF.Grid(ship.width, ship.height,
                        ship.getPfMatrix());
                }
                this.path = pathfinder.findPath(unit.x, unit.y, dest.x, dest.y,
                    this.grid.clone());
                this.pathIndex = 1;
            } else {
                this.pathIndex++;
            }
            nextTile = {x: this.path[this.pathIndex][0],
                y: this.path[this.pathIndex][1]};
            if (this.tileIsClear(time, ship, unit, nextTile)) {
                return state(this, false,
                    [new sh.actions.SetUnitProperty({
                        time: time,
                        unitID: unit.id,
                        property: 'moveLock',
                        value: nextTile
                    })]);
            }
            return state(this, false, []);
        },
        tileIsClear: function(time, ship, unit, tile) {
            var units = ship.unitsMap.at(tile.x, tile.y),
                arrivalTime = time + unit.getTimeForMoving(unit, tile, ship);
            return (!units || //there's no unit ahead
                _.all(units, function(u) { //or...
                    //it's from a different team
                    return u.ownerID !== unit.ownerID ||
                        //or it's going away
                        (u.moving &&
                            !_.isEqual(u.moving.dest, tile) &&
                            u.moving.arrivalTime <= arrivalTime
                            );
                })) &&

                !_.any(ship.getPlayerUnits(unit.ownerID),
                    function(u) {
                        //no unit is moving there
                        return (u.moving &&
                            _.isEqual(u.moving.dest, tile)) ||
                            //no unit with higher rank prepared to move there
                            (u.id > unit.id &&
                                _.isEqual(u.moveLock, tile));
                    });
        },
        toJson: function() {
            console.log('converting order to json');
            return this.parent();
        }
    });
}());
