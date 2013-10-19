/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module, hullMaps*/

var sh = require('./70_map'), _ = sh._;
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
    hullMap: {},
    itemsMap: {},
    hp: 500,
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
            new sh.Map(this.hullMap), this.itemsMap, this.unitsMap
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
        this.width = hull.width;
        this.height = hull.height;
    },
    //this should be called when the user builds something
    buildAt: function(x, y, buildingType) {
        'use strict';
        var self = this,
            building = sh.make.itemModel(buildingType),
            canBuild = building.canBuildAt(x, y, this),
            canBuildRotated;
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
    putUnit: function(settings) {
        'use strict';
        //find empty spot
        var empty = null, ship = this, unit;
        sh.utils.matrixTiles(ship.width, ship.height,
            function(x, y) {
                if (empty) {
                    return;
                }
                if (ship.at(x, y) === sh.tiles.clear) {
                    empty = {x: x, y: y};
                }
            });
        if (settings instanceof sh.Unit) {
            unit = settings;
            unit.x = empty.x;
            unit.y = empty.y;
        } else {
            unit = new sh.Unit(empty.x, empty.y, settings);

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
        this.built.push(item);
        item.onShip(this);
        this.buildingsChanged();
    },
    addUnit: function(unit) {
        'use strict';
        this.units.push(unit);
        unit.ship = this;
        if (unit.id === null) {
            unit.id = this.units.length;
        }
        this.unitsMap.update();
    },
    getUnitByID: function(id) {
        'use strict';
        return _.find(this.units, function(u) {
            return u.id === parseInt(id, 10);
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
            'buildings': _.map(this.built, function(b) {
                return b.toJson();
            }),
            'units': _.map(this.units, function(u) {
                return u.toJson();
            })
        };
    },
    fromJson: function(json) {
        'use strict';
        var ship = this;
        ship.removeAll();
        _.each(json.buildings, function(b) {
            ship.addItem(sh.make.itemFromJson(b));
        });
        _.each(json.units, function(u) {
            ship.addUnit(sh.make.unitFromJson(u));
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
    clone: function() {
        'use strict';
        return new sh.Ship({json: this.toJson()});
    }
});

