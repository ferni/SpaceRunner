/*
 -*- coding: utf-8 -*-
 * vim: set ts=4 sw=4 et sts=4 ai:
 * Copyright 2013 MITHIS
 * All rights reserved.
 */

/*global require, exports*/

var sh = require('../public/js/shared'),
    _ = require('underscore')._;


//AI player stuff
(function(exports) {
    'use strict';
    var pfFinder = new sh.PF.AStarFinder({
            allowDiagonal: true
        }),
        AIPlayer;

    function getWeakSpotsTiles(ship) {
        var weakSpots = _.filter(ship.built, function(i) {
                return i instanceof sh.items.WeakSpot;
            }),
            tiles = [];
        _.each(weakSpots, function(ws) {
            ws.tiles(function(x, y) {
                tiles.push({x: x, y: y});
            });
        });
        return tiles;
    }

    function addOrderToArray(unit, orderArray, order) {
        var unitOrders = new sh.UnitOrders({unitID: unit.id});
        unitOrders.array = [order];
        orderArray.addUnitOrders(unitOrders);
    }

    function makeUnitsUnwalkable(ship, grid) {
        var units = ship.units;
        _.each(units, function(u) {
            if (u.x >= 0 && u.x < grid.width &&
                    u.y >= 0 && u.y < grid.height) {
                grid.setWalkableAt(u.x, u.y, false);
            }
        });
        return grid;
    }

    function getPaths(grid, from, destinations) {
        var paths = [];
        _.each(destinations, function(d) {
            var path = pfFinder.findPath(from.x, from.y, d.x, d.y,
                grid.clone());
            if (path.length > 1) {
                paths.push(path);
            }
        });
        return paths;
    }

    function getShortest(arrays) {
        return _.min(arrays, function(a) {
            return a.length;
        });
    }

    function pathDestination(path) {
        var dest = _.last(path);
        return {x: dest[0], y: dest[1]};
    }

    function setOrderForShortestPath(grid, unit, destinations, orders) {
        var paths = getPaths(grid.clone(), unit, destinations);
        if (paths.length > 0) {
            addOrderToArray(unit, orders, new sh.orders.Move({
                unitID: unit.id,
                destination: pathDestination(getShortest(paths))
            }));
            return true;
        }
        return false;
    }

    function setSeekAndDestroyOrderForShortestPath(grid, unit, targets,
                                                   orders) {
        var paths = getPaths(grid.clone(), unit, targets);
        if (paths.length > 0) {
            addOrderToArray(unit, orders, new sh.orders.SeekAndDestroy({
                unitID: unit.id,
                targetID: _.find(targets, function(t) {
                    return sh.v.equal(pathDestination(getShortest(paths)), t);
                }).id
            }));
            return true;
        }
        return false;
    }

    function setOrdersInOwnShip(orders, myShip, playerID) {
        var units = myShip.getPlayerUnits(playerID);
        _.each(units, function(unit) {
            addOrderToArray(unit, orders, new sh.orders.Move({
                unitID: unit.id,
                destination: {x: unit.x + 2, y: unit.y}
            }));
        });
    }

    function setOrdersInEnemyShip(orders, ship, playerID) {
        var grid = new sh.PF.Grid(ship.width, ship.height,
                    ship.getPfMatrix()),
            gridWithUnits = makeUnitsUnwalkable(ship, grid.clone()),
            myUnits = _.groupBy(ship.getPlayerUnits(playerID), 'type'),
            enemyUnits = _.filter(ship.units, function(u) {
                return u.ownerID !== playerID;
            }),
            tiles = getWeakSpotsTiles(ship),
            free = [],
            occupied = [];
        _.each(tiles, function(t) {
            if (_.any(myUnits, function(unit) {
                    return unit.x === t.x && unit.y === t.y;
                })) {
                occupied.push(t);
            } else {
                free.push(t);
            }
        });
        _.each(myUnits.Critter, function(unit) {
            if (ship.itemsMap.at(unit.x, unit.y) instanceof
                    sh.items.WeakSpot) {
                //already at the spot, don't move
                return;
            }
            //optimal: to free tile avoiding units
            if (setOrderForShortestPath(gridWithUnits.clone(), unit,
                    free, orders)) {
                return;
            }
            //2nd optimal: to free tile through units
            if (setOrderForShortestPath(grid.clone(), unit,
                    free, orders)) {
                return;
            }
            //3rd optimal: to occupied tile avoiding units
            if (setOrderForShortestPath(gridWithUnits.clone(), unit,
                    occupied, orders)) {
                return;
            }
            //4th optimal: to occupied tile through units
            setOrderForShortestPath(grid.clone(), unit,
                    occupied, orders);
        });
        _.each(myUnits.MetalSpider, function(unit) {
            setSeekAndDestroyOrderForShortestPath(grid.clone(), unit,
                enemyUnits, orders);
        });
    }

    /**
     * An AI controlled player.
     * @type {*}
     */
    AIPlayer = sh.Player.extendShared({
        init: function(name) {
            this.parent({
                id: -1,
                name: name
            });
        },
        /**
         * Gets the orders that the player would give for the current turn.
         * @param {sh.Battle} battle The battle.
         */
        getOrders: function(battle) {
            var orders = new sh.OrderCollection(),
                myShip = battle.getPlayerShips(this)[0],
                enemyShip = battle.getEnemyShips(this)[0];
            setOrdersInOwnShip(orders, myShip, this.id);
            setOrdersInEnemyShip(orders, enemyShip, this.id);

            return orders;
        }
    });
    exports.AIPlayer = AIPlayer;
}(exports));
