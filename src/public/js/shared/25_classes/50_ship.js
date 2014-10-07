/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module, hullMaps*/

var sh = require('../25_classes/40_map'), _ = sh._;
if (typeof exports !== 'undefined') {
    /**
     * exports from NodeJS
     * @type {*}
     */
    sh = module.exports = sh;
}

/**
 * A ship.
 * @type {*}
 */
sh.Ship = sh.SharedClass.extendShared({
    id: null,
    owner: null,
    hullMap: {},
    itemsMap: {},
    hp: 2000,
    init: function(settings) {
        'use strict';
        if (!settings.tmxName && !settings.json) {
            throw 'Ship settings must have tmxName or jsonData';
        }
        if (settings.json) {
            this.tmxName = settings.json.tmxName;
        } else {
            this.tmxName = settings.tmxName;
        }
        this.loadMap();
        //Array of items built
        this.built = [];
        this.itemsMap = new sh.EntityMap(this.width, this.height,
            this.built);
        this.units = [];
        this.unitsMap = new sh.EntityMap3d(this.width, this.height,
            this.units);
        this.map = new sh.CompoundMap([
            new sh.Map(this.hullMap).scale(sh.GRID_SUB), this.itemsMap,
            this.unitsMap
        ]);
        if (settings.json) {
            this.fromJson(settings.json);
        }
    },
    loadMap: function() {
        'use strict';
        var hull;
        if (!hullMaps) {
            throw 'hullMaps global object not found';
        }
        hull = hullMaps[this.tmxName.toLowerCase()];
        if (!hull) {
            throw 'hullMap "' + this.tmxName.toLowerCase() + '" not found';
        }
        this.hullMap = hull.map;
        this.width = hull.width * sh.GRID_SUB;
        this.height = hull.height * sh.GRID_SUB;
    },
    //this should be called when the user builds something
    buildAt: function(x, y, buildingType) {
        'use strict';
        var self, building, canBuild, canBuildRotated;
        self = this;
        if (!sh.items[buildingType]) {
            throw 'No such item type "' + buildingType + '".';
        }
        building = new sh.items[buildingType]({});
        canBuild = building.canBuildAt(x, y, this);
        if (!canBuild) {
            canBuildRotated = building.canBuildRotated(x, y, this);
            if (canBuildRotated) {
                building.rotated(true);
            }
        }
        if (canBuild || canBuildRotated) {
            building.x = x;
            building.y = y;
            //remove anything in its way
            building.tiles(function(iX, iY) {
                self.removeAt(iX, iY);
            }, this);
            this.addItem(building);
            building.onBuilt();
            return building; //building successful
        }
        return null; //building failed
    },
    //finds a clear spot and creates a new unit there
    putUnit: function(unit) {
        'use strict';
        //find empty spot
        var empty = null, ship = this;
        empty = this.closestTile(Math.floor(ship.width / 2),
            Math.floor(ship.height / 2),
            function(tile) {
                return tile === sh.tiles.clear;
            });
        sh.utils.matrixTiles(ship.width, ship.height,
            function(x, y) {
                if (empty) {
                    return;
                }
                if (ship.at(x, y) === sh.tiles.clear) {
                    empty = {x: x, y: y};
                }
            });
        unit.x = empty.x;
        unit.y = empty.y;
        if (unit.ownerID === undefined) {
            unit.ownerID = this.owner.id;
        }
        this.addUnit(unit);
        return unit;
    },
    /**
     * Finds the closest position to x, y that satisfies the condition
     * for the tile at that position.
     * It searches the map in a spiral fashion from the starting tile.
     * @param {int} x
     * @param {int} y
     * @param {Function} condition
     * @return {{x: int, y: int}}
     */
    closestTile: function(x, y, condition) {
        'use strict';
        var squareWidth = 1,
            going = 'right',
            direction,
            i,
            widthTimes2,
            heightTimes2;
        if (condition(this.map.at(x, y))) {
            return {x: x, y: y};
        }
        widthTimes2 = this.width * 2;
        heightTimes2 = this.height * 2;
        do {
            //change direction
            switch (going) {
            case 'down':
                going = 'left';
                direction = [-1, 0];
                break;
            case 'left':
                going = 'up';
                direction = [0, -1];
                break;
            case 'up':
                going = 'right';
                direction = [1, 0];
                break;
            case 'right':
                going = 'down';
                direction = [0, 1];
                //move to next outer square
                squareWidth += 2;
                x++;
                y--;
                break;
            }
            //traverse one side
            for (i = 0; i < squareWidth - 1; i++) {
                x += direction[0];
                y += direction[1];
                if (condition(this.map.at(x, y))) {
                    return {x: x, y: y};
                }
            }
        } while (squareWidth < widthTimes2 && squareWidth < heightTimes2);
        //didn't find any
        return null;
    },
    //Adds an item to the ship ignoring its placement rules
    addItem: function(item) {
        'use strict';
        if (item.id === undefined || item.id === null) {
            this.assignItemID(item);
        }
        this.built.push(item);
        item.onShip(this);
        this.buildingsChanged();
    },
    assignItemID: function(item) {
        'use strict';
        if (this.built.length === 0) {
            item.id = 1;
            return;
        }
        item.id = _.max(this.built, function(e) {
            return e.id;
        }).id + 1;
    },
    addUnit: function(unit) {
        'use strict';
        if (unit.id === undefined || unit.id === null) {
            this.battle.assignUnitID(unit);
        }
        this.units.push(unit);
        unit.ship = this;
        this.unitsMap.update();
    },
    getUnitByID: function(id) {
        'use strict';
        return _.find(this.units, function(u) {
            return u.id === parseInt(id, 10);
        });
    },
    getItemByID: function(id) {
        'use strict';
        return _.find(this.built, function(b) {
            return b.id === parseInt(id, 10);
        });
    },
    getPlayerUnits: function(playerID) {
        'use strict';
        return _.filter(this.units, function(unit) {
            return unit.ownerID === playerID;
        });
    },
    removeAt: function(x, y) {
        'use strict';
        //remove while is not string (is an item or unit)
        while (!(_.isString(this.at(x, y)))) {
            this.remove(this.at(x, y), true);
        }
    },
    remove: function(item, updateBuildings) {
        'use strict';
        var index;
        if (!item) {
            return;
        }
        if (updateBuildings === undefined) {
            updateBuildings = true; //updates by default
        }
        index = _.indexOf(this.built, item);
        this.built.splice(index, 1);
        if (updateBuildings) {
            this.buildingsChanged();
        }
    },
    removeAll: function() {
        'use strict';
        var self = this,
            i;
        for (i = this.built.length - 1; i >= 0; i--) {
            self.remove(this.built[i], false);
        }
        this.buildingsChanged();
    },
    removeUnit: function(unit) {
        'use strict';
        var index = _.indexOf(this.units, unit);
        this.units.splice(index, 1);
        this.unitsMap.update();
    },
    //to call whenever buildings change
    buildingsChanged: function() {
        'use strict';
        this.itemsMap.update();
        this.onBuildingsChanged();
    },
    onBuildingsChanged: function() {
        'use strict';
        return 0;
    },
    at: function(x, y) {
        'use strict';
        return this.map.at(x, y);
    },
    hasUnits: function(position) {
        'use strict';
        return this.unitsMap.at(position.x, position.y);
    },
    isInside: function(x, y) {
        'use strict';
        var tile = this.at(x, y);
        return tile !== sh.tiles.solid && tile !== sh.tiles.front &&
            tile !== sh.tiles.back;
    },
    toJson: function() {
        'use strict';
        return {
            'tmxName': this.tmxName,
            'id': this.id,
            'hp': this.hp,
            'owner': this.owner ? this.owner.toJson() : null,
            'buildings': sh.utils.mapToJson(this.built),
            'units': sh.utils.mapToJson(this.units),
            'GRID_SUB': sh.GRID_SUB
        };
    },
    fromJson: function(json) {
        'use strict';
        var ship = this,
            jsonGridSub;
        if (json.id !== undefined) {
            this.id = parseInt(json.id, 10);
        }
        if (json.hp !== undefined) {
            this.hp = parseInt(json.hp, 10);
        }
        this.owner = new sh.Player(json.owner);
        if (json.GRID_SUB !== undefined) {
            jsonGridSub = parseInt(json.GRID_SUB, 10);
        } else {
            jsonGridSub = 1;
        }
        ship.removeAll();
        if (sh.GRID_SUB !== jsonGridSub) {
            console.warn('GRID_SUB from json differs from current GRID_SUB,' +
                ' the values will be converted.');
        }
        _.each(json.buildings, function(b) {
            if (sh.GRID_SUB !== jsonGridSub) {
                sh.utils.convertPosition(b, jsonGridSub, sh.GRID_SUB);
            }
            ship.addItem(new sh.items[b.type](b));
        });
        _.each(json.units, function(u) {
            if (u.type === 'Unit') {//is generic unit
                ship.addUnit(new sh.Unit(u));
            } else { //is specific unit
                ship.addUnit(new sh.units[u.type](u));
            }
        });
        this.buildingsChanged();
    },
    getPfMatrix: function() {
        'use strict';
        var ship = this,
            pfMatrix = sh.utils.getEmptyMatrix(this.width, this.height, 1);
        ship.map.tiles(function(x, y) {
            if (ship.isWalkable(x, y)) {
                pfMatrix[y][x] = 0;
            }
        });
        return pfMatrix;
    },
    isWalkable: function(x, y) {
        'use strict';
        var tile = this.map.at(x, y);
        //clear tiles and units are walkable
        return tile === sh.tiles.clear || this.hasUnits({x: x, y: y}) ||
            (tile instanceof sh.Item && tile.walkable);
    },
    endOfTurnReset: function(turnDuration) {
        'use strict';
        var self = this,
            i,
            unit;
        for (i = 0; i < this.units.length; i++) {
            unit = this.units[i];
            if (!unit.isAlive()) {
                self.removeUnit(unit);
                i--;
            } else {
                if (unit.chargingShipWeapon) {
                    unit.chargingShipWeapon.startingTime -= turnDuration;
                }
                unit.distracted = false;
            }
        }
        this.unitsMap.update();
    },
    getValidOrderForPos: function(unit, pos) {
        'use strict';
        var stuff = this.map.at(pos.x, pos.y),
            enemies,
            order;
        if (_.isArray(stuff)) {
            enemies = _.filter(stuff, function(u) {
                return u instanceof sh.Unit && u.isEnemy(unit);
            });
            if (enemies.length > 0) {
                order = new sh.orders.SeekAndDestroy({
                    unitID: unit.id,
                    targetID: enemies[0].id
                });
            }
        } else {
            if (stuff instanceof sh.items.Console) {
                order = new sh.orders.MoveToConsole({
                    unitID: unit.id,
                    destination: {x: pos.x, y: pos.y}
                });
            } else if (this.isWalkable(pos.x, pos.y)) {
                order = new sh.orders.Move({
                    unitID: unit.id,
                    destination: {x: pos.x, y: pos.y}
                });
            }
        }
        if (order && order.isValid(this, unit.ownerID)) {
            return order;
        }
        return null;
    }
});

