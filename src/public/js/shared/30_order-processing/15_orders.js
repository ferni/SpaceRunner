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

    sh.OrderPackage = sh.SharedClass.extendShared({
        orders: {},
        init: function(orders) {
            this.orders = orders;
        },
        toJson: function() {
            var ordersJson = {};
            _.each(this.orders, function(unitsOrders, unitID) {
                ordersJson[unitID] = _.map(unitsOrders, function(order) {
                    return order.toJson();
                });
                if (ordersJson[unitID].length === 0) {
                    ordersJson[unitID] = 'empty';
                }
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
            _.each(json.orders, function(unitsOrders, unitID) {
                if (unitsOrders === 'empty') {
                    self.orders[unitID] = [];
                    return;
                }
                self.orders[unitID] = _.map(unitsOrders, function(orderJson) {
                    return new sh.orders[orderJson.type](orderJson);
                });
            });
            return this;
        }
    });

    sh.Order = sh.Jsonable.extendShared({
        init: function(json) {
            this.set('Order', ['unitID'], json);
            this.finished = false;
        },
        isValid: function(ship, playerID) {
            var unit = ship.getUnitByID(this.unitID);
            return unit && unit.ownerID === playerID;
        }
    });

    function tileIsClear(time, ship, unit, tile) {
        var units = ship.unitsMap.at(tile.x, tile.y),
            arrivalTime = time + unit.getTimeForMoving(unit, tile, ship);
        return (!units ||//there's no unit ahead
            _.all(units, function(u) {
                return !u.isAlive() ||//or they're either dead...
                    (u.moving && //...or they're going away
                    sh.v.equal(u.moving.dest, tile) &&
                    u.moving.arrivalTime <= arrivalTime
                    );
            })) &&

            !_.any(ship.units,
                function(u) {
                    //no unit is moving there
                    return (u.moving &&
                        sh.v.equal(u.moving.dest, tile)) ||
                        //no unit with higher rank prepared to move there
                        (u.id > unit.id &&
                            u.moveLock &&
                            sh.v.equal(u.moveLock, tile));
                });
    }

    sh.orders = {};
    sh.orders.Move = sh.Order.extendShared({
        init: function(json) {
            this.parent(json);
            //in case its a me.Vector2D
            json.destination = {
                x: parseInt(json.destination.x, 10),
                y: parseInt(json.destination.y, 10)
            };
            this.set('Move', ['destination'], json);
        },
        /**
         * Returns the actions for the unit to do while the order is the
         * active one.
         * @param {int} time
         * @param {sh.Ship} ship
         * @return {{actions:{Array}, finished:{Boolean}}
         */
        getActions: function(time, ship) {
            var unit, dest = this.destination, nextTile, from;
            if (this.finished) {
                throw 'Order was already finished';
            }
            unit = ship.getUnitByID(this.unitID);
            if (sh.v.equal(unit, dest)) {
                //unit is already at destination
                this.finished = true;
                return [];
            }
            if (unit.moving) {
                return [];
            }
            if (unit.moveLock) {
                from = {x: unit.x,
                    y: unit.y};
                this.pathIndex++;
                this.finished = !this.path ||
                    this.pathIndex >= this.path.length;
                return [new sh.actions.Move({
                    time: time,
                    unitID: unit.id,
                    from: from,
                    to: unit.moveLock,
                    duration: unit.getTimeForMoving(from, unit.moveLock,
                        ship)
                })];
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
            }
            if (this.pathIndex >= this.path.length) {
                this.finished = true;
                return [];
            }
            nextTile = {x: this.path[this.pathIndex][0],
                y: this.path[this.pathIndex][1]};
            if (tileIsClear(time, ship, unit, nextTile)) {
                return [new sh.actions.SetUnitProperty({
                    time: time,
                    unitID: unit.id,
                    property: 'moveLock',
                    value: nextTile
                })];
            }
            return [];
        },
        toString: function() {
            return 'Move to ' + sh.v.str(this.destination);
        },
        isValid: function(ship, playerID) {
            return this.parent(ship, playerID) &&
                ship.isWalkable(this.destination.x, this.destination.y);
        }
    });

    sh.orders.SeekAndDestroy = sh.Order.extendShared({
        init: function(json) {
            this.parent(json);
            this.set('SeekAndDestroy', ['targetID'], json);
        },
        getActions: function(time, ship) {
            var unit, target, nextTile, from;
            if (this.finished) {
                throw 'Order was already finished';
            }
            unit = ship.getUnitByID(this.unitID);
            target = ship.getUnitByID(this.targetID);
            if (!target || !target.isAlive()) {
                //unit is already dead
                this.finished = true;
                return [];
            }
            if (unit.moving) {
                return [];
            }
            if (unit.isInRange(target)) {
                return [];
            }
            if (unit.moveLock) {
                from = {x: unit.x,
                    y: unit.y};
                this.pathIndex++;
                this.finished = this.pathIndex >= this.path.length;
                return [new sh.actions.Move({
                    time: time,
                    unitID: unit.id,
                    from: from,
                    to: unit.moveLock,
                    duration: unit.getTimeForMoving(from, unit.moveLock,
                        ship)
                })];
            }
            if (!this.path || this.pathOutOfTarget(this.path, target)) {
                //find a path towards the target
                this.path = pathfinder.findPath(unit.x, unit.y, target.x,
                    target.y, new sh.PF.Grid(ship.width, ship.height,
                        ship.getPfMatrix()));
                this.pathIndex = 1;
            }
            if (this.path.length <= 1) {
                return [];
            }
            nextTile = {x: this.path[this.pathIndex][0],
                y: this.path[this.pathIndex][1]};
            if (tileIsClear(time, ship, unit, nextTile)) {
                return [new sh.actions.SetUnitProperty({
                    time: time,
                    unitID: unit.id,
                    property: 'moveLock',
                    value: nextTile
                })];
            }
            return [];
        },
        pathOutOfTarget: function(path, target) {
            var pathLast = _.last(path);
            pathLast = {x: pathLast[0], y: pathLast[1]};
            return !sh.v.equal(pathLast, target);
        },
        toString: function() {
            return 'Seek & Destroy';
        },
        isValid: function(ship, playerID) {
            var unit = ship.getUnitByID(this.unitID),
                target = ship.getUnitByID(this.targetID);
            return this.parent(ship, playerID) &&
                target &&
                unit.isEnemy(target);
        }
    });
}());
