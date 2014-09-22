/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module*/
var sh = require('../25_classes/60_actions'), _ = sh._;
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

    sh.OrderCollection = sh.SharedClass.extendShared({
        init: function() {
            this.orders = {};
        },
        /**
         * Adds a unit's orders to the collection.
         * @param orderArray Array Array of sh.Order.
         * @param unitID {int|String} The unit id to which the orders belong.
         */
        addUnitOrders: function(orderArray, unitID) {
            unitID = parseInt(unitID, 10);
            if (_.any(orderArray, function(order) {
                    return order.unitID !== unitID;
                })) {
                throw 'There are orders that don\'t belong to the unit';
            }
            this.orders[unitID] = orderArray;
        }
    });

    sh.OrderPackage = sh.SharedClass.extendShared({
        orders: {},
        init: function(orders) {
            this.orders = orders;
        },
        toJson: function() {
            var ordersJson = {};
            _.each(this.orders, function(unitsOrders, unitID) {
                ordersJson[unitID] = sh.utils.mapToJson(unitsOrders);
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
                self.orders[unitID] = sh.utils.mapFromJson(unitsOrders,
                    sh.orders);
            });
            return this;
        }
    });

    sh.Order = sh.Jsonable.extendShared({
        init: function(json) {
            this.setJson({
                type: 'Order',
                properties: ['unitID'],
                json: json
            });
        },
        isValid: function(battle, playerID) {
            var unit = battle.getUnitByID(this.unitID);
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
                    !sh.v.equal(u.moving.dest, tile) &&
                    u.moving.arrivalTime <= arrivalTime
                    );
            })) &&

            !_.any(ship.units,
                function(u) {
                    //no unit is moving there
                    return u.id !== unit.id &&
                        u.moving &&
                        sh.v.equal(u.moving.dest, tile);
                });
    }

    sh.orders = {};

    //Abstract class
    sh.orders.GoTo = sh.Order.extendShared({
        init: function(json) {
            this.parent(json);
        },
        goTo: function(pos, battle) {
            var self = this,
                unit = battle.getUnitByID(this.unitID),
                ship = unit.ship;
            this.goToState = {
                to: pos,
                arrived: false,
                path: self.getPath(unit, pos, ship),
                pathIndex: 1
            };
        },
        getPath: function(from, to, ship) {
            if (!this.gridForPath) {
                this.gridForPath = new sh.PF.Grid(ship.width, ship.height,
                    ship.getPfMatrix());
            }
            return pathfinder.findPath(from.x, from.y, to.x, to.y,
                this.gridForPath.clone());
        },
        getMoveAction: function(time, battle) {
            var state = this.goToState,
                unit,
                ship,
                nextTile,
                from;
            if (state && !state.arrived) {
                unit = battle.getUnitByID(this.unitID);
                ship = unit.ship;
                if (sh.v.equal(unit, state.to)) {
                    //unit is already at destination
                    state.arrived = true;
                    return null;
                }
                if (unit.moving) {
                    return null;
                }
                if (!state.path || state.pathIndex >= state.path.length) {
                    this.goToState.arrived = true;
                    return null;
                }
                nextTile = {x: state.path[state.pathIndex][0],
                    y: state.path[state.pathIndex][1]};
                if (tileIsClear(time, ship, unit, nextTile)) {
                    from = {x: unit.x, y: unit.y};
                    state.pathIndex++;
                    return new sh.actions.Move({
                        unitID: unit.id,
                        from: from,
                        to: nextTile,
                        duration: unit.getTimeForMoving(from, nextTile, ship)
                    });
                }
                return null;
            }
            return null;
        }
    });
    sh.orders.Move = sh.orders.GoTo.extendShared({
        init: function(json) {
            this.parent(json);
            //in case its a me.Vector2D
            json.destination = {
                x: parseInt(json.destination.x, 10),
                y: parseInt(json.destination.y, 10)
            };
            this.setJson({
                type: 'Move',
                properties: ['destination'],
                json: json
            });
        },
        /**
         * Returns the actions for the unit to do while the order is the
         * active one.
         * @param {int} time
         * @param {sh.Battle} battle
         * @return {Array}
         */
        getActions: function(time, battle) {
            var move;
            if (!this.goToState) {
                this.goTo(this.destination, battle);
            }
            if (!this.goToState.arrived) {
                move = this.getMoveAction(time, battle);
                return move ? [move] : [];
            }
            return [new sh.actions.FinishOrder({
                unitID: this.unitID
            })];
        },
        toString: function() {
            return 'Move to ' + sh.v.str(this.destination);
        },
        isValid: function(battle, playerID) {
            var ship = battle.getUnitByID(this.unitID).ship;
            return this.parent(battle, playerID) &&
                ship.isWalkable(this.destination.x, this.destination.y);
        }
    });

    sh.orders.MoveToConsole = sh.orders.Move.extendShared({
        init: function(json) {
            this.parent(json);
            this.setJson({
                type: 'MoveToConsole',
                properties: [],
                json: json
            });
        },
        toString: function() {
            return 'Move to Console';
        },
        isValid: function(battle, playerID) {
            var ship = battle.getUnitByID(this.unitID).ship;
            return this.parent(battle, playerID) &&
                ship.itemsMap.at(this.destination.x,
                    this.destination.y) instanceof sh.items.Console;
        }
    });

    sh.orders.SeekAndDestroy = sh.orders.GoTo.extendShared({
        init: function(json) {
            this.parent(json);
            this.setJson({
                type: 'SeekAndDestroy',
                properties: ['targetID'],
                json: json
            });
        },
        getActions: function(time, battle) {
            var unit, target, move;
            unit = battle.getUnitByID(this.unitID);
            target = battle.getUnitByID(this.targetID);
            if (!target || !target.isAlive()) {
                //unit is already dead
                return [new sh.actions.SetUnitProperty({
                    unitID: unit.id,
                    property: 'targetID',
                    value: null
                }),
                    new sh.actions.FinishOrder({
                        unitID: unit.id
                    })];
            }
            if (unit.targetID === null || unit.targetID === undefined) {
                return [new sh.actions.SetUnitProperty({
                    unitID: unit.id,
                    property: 'targetID',
                    value: target.id
                })];
            }
            if (unit.moving) {
                return [];
            }
            if (unit.isInRange(target)) {
                return [];
            }
            if (!this.goToState ||
                    this.pathOutOfTarget(this.goToState.path, target)) {
                this.goTo(target, battle);
            }
            move = this.getMoveAction(time, battle);
            return move ? [move] : [];
        },
        pathOutOfTarget: function(path, target) {
            var pathLast = _.last(path);
            pathLast = {x: pathLast[0], y: pathLast[1]};
            return !sh.v.equal(pathLast, target);
        },
        toString: function() {
            return 'Seek & Destroy';
        },
        isValid: function(battle, playerID) {
            var unit = battle.getUnitByID(this.unitID),
                target = battle.getUnitByID(this.targetID);
            return this.parent(battle, playerID) &&
                target &&
                target.isAlive() &&
                unit.isEnemy(target) &&
                unit.ship === target.ship;
        }
    });
}());
