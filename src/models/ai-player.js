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
        AIPlayer,
        distribute;

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

    function equalDestination(path, destination) {
        return sh.v.equal(pathDestination(path), destination);
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
                targetID: _.find(targets, function(target) {
                    return equalDestination(getShortest(paths), target);
                }).id
            }));
            return true;
        }
        return false;
    }

    /**
     * Distribute units among destinations so each
     * destination is targeted by the closest unit.
     */
    distribute = (function() {
        function getDistance(unit, destination) {
            //Ignore paths. Inadequate in some cases but much more efficient.
            return Math.abs(unit.x - destination.x) +
                Math.abs(unit.y - destination.y);
        }

        function removeDestination(destination) {
            return function(dis2desArray) {
                var i;
                for (i = 0; i < dis2desArray.length; i++) {
                    if (dis2desArray[i].destination === destination) {
                        dis2desArray.splice(i, 1);
                        break;
                    }
                }
            };
        }

        function getMinDistanceByUnit(distancesByUnit) {
            var minDistanceByUnit = {};
            _.each(distancesByUnit, function(dis2desArray, unitID) {
                minDistanceByUnit[unitID] = _.min(dis2desArray, 'distance');
            });
            return minDistanceByUnit;
        }

        return function(units, destinations) {
            var distancesByUnit = {},
                destinationsByUnit = {},
                minDistanceByUnit,
                dis2des;
            //Get all distances
            _.each(units, function(u) {
                distancesByUnit[u.id] = [];
                _.each(destinations, function(d) {
                    distancesByUnit[u.id].push({
                        destination: d,
                        unit: u,
                        distance: getDistance(u, d)
                    });
                });
            });
            minDistanceByUnit = getMinDistanceByUnit(distancesByUnit);
            while (_.size(destinationsByUnit) < units.length) {
                dis2des = _.min(minDistanceByUnit, 'distance');
                destinationsByUnit[dis2des.unit.id] = dis2des.destination;
                delete distancesByUnit[dis2des.unit.id];
                _.each(distancesByUnit, removeDestination(dis2des.destination));
                minDistanceByUnit = getMinDistanceByUnit(distancesByUnit);
            }
            return destinationsByUnit;
        };
    }());

    /**
     * An AI controlled player.
     * @type {*}
     */
    AIPlayer = sh.Player.extendShared({
        init: function(name, battleServer) {
            this.parent({
                id: -1,
                name: name
            });
            this.battleServer = battleServer;
            this.battle = battleServer.battleModel;
        },
        getShipData: function(ship) {
            var data = {},
                myUnits,
                enemies;

            //PATHFINDING GRID
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
            data.grid = new sh.PF.Grid(ship.width, ship.height,
                ship.getPfMatrix());
            data.gridWithUnits = makeUnitsUnwalkable(ship, data.grid.clone());

            //UNITS BY TYPE
            myUnits = ship.getPlayerUnits(this.id);
            data.allies = _.groupBy(myUnits, 'type');
            data.allies.all = myUnits;
            enemies = _.filter(ship.units, function(u) {
                return u.ownerID !== this.id;
            }, this);
            data.enemies = _.groupBy(enemies, 'type');
            data.enemies.all = enemies;
            data.ship = ship;
            return data;
        },
        prepareForBattle: function() {
            this.ownShip = this.battle.getPlayerShips(this.id)[0];
            this.enemyShip = this.battle.getEnemyShips(this.id)[0];
        },
        /**
         * Gets the orders that the player would give for the current turn.
         */
        getOrders: function() {
            var orders = new sh.OrderCollection();
            this.setOrdersInOwnShip(orders);
            this.setOrdersInEnemyShip(orders);
            return orders;
        },
        setOrdersInOwnShip: function (orders) {
            var s = this.getShipData(this.ownShip),
                weaponConsoles = _.filter(s.ship.built, function(item) {
                    return item.type === 'Console' &&
                        item.getControlled().type === 'Weapon';
                });
            _.each(weaponConsoles, function(console, index) {
                var unit = s.allies.Critter[index];
                if (!unit || unit.orders.length > 0) {
                    return;
                }
                addOrderToArray(unit, orders, new sh.orders.Move({
                    unitID: unit.id,
                    destination: console
                }));
            });
            //SEEK & DESTROY
            _.each(s.allies.MetalSpider, function(unit) {
                setSeekAndDestroyOrderForShortestPath(s.grid.clone(), unit,
                    s.enemies.all, orders);
            });
        },
        setOrdersInEnemyShip: function (orders) {
            var s = this.getShipData(this.enemyShip),
                free = [],
                occupied = [];

            //Get occupied and free tiles in weak spot.
            _.each(getWeakSpotsTiles(s.ship), function(tile) {
                if (_.any(s.allies.all, function(unit) {
                        return unit.x === tile.x && unit.y === tile.y;
                    })) {
                    occupied.push(tile);
                } else {
                    free.push(tile);
                }
            });

            //GO TO THE WEAK SPOT
            _.each(s.allies.Critter, function(unit) {
                if (s.ship.itemsMap.at(unit.x, unit.y) instanceof
                        sh.items.WeakSpot) {
                    //already at the spot, don't move
                    return;
                }
                //optimal: to free tile avoiding units
                if (setOrderForShortestPath(s.gridWithUnits.clone(), unit,
                        free, orders)) {
                    return;
                }
                //2nd optimal: to free tile through units
                if (setOrderForShortestPath(s.grid.clone(), unit,
                        free, orders)) {
                    return;
                }
                //3rd optimal: to occupied tile avoiding units
                if (setOrderForShortestPath(s.gridWithUnits.clone(), unit,
                        occupied, orders)) {
                    return;
                }
                //4th optimal: to occupied tile through units
                setOrderForShortestPath(s.grid.clone(), unit,
                        occupied, orders);
            });

            //SEEK & DESTROY
            _.each(s.allies.MetalSpider, function(unit) {
                setSeekAndDestroyOrderForShortestPath(s.grid.clone(), unit,
                    s.enemies.all, orders);
            });
        }
    });
    exports.AIPlayer = AIPlayer;
}(exports));
