/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, charMap, utils, _ */

var Ship = Object.extend({
    hullMap: {},
    buildingsMap: {},
    _map : null,
    init : function(settings, syncWithGame) {
        'use strict';
        var ship = this;
        this.hullMap = {
            changed: true,
            _hullMap: null,
            update: function() {
                this._hullMap = charMap.get(ship.tmxTileMap);
                this.changed = true;
            },
            get: function() {
                if (this._hullMap === null) {
                    this.update();
                }
                return this._hullMap;
            }
        };
        this.buildingsMap = {
            changed: true,
            _buildingsMap: null,
            update: function() {
                var self = this;
                self._buildingsMap = utils.getEmptyMatrix(ship.width,
                    ship.height, charMap.codes._cleared);
                _.each(ship.buildings(), function(b) {
                    if (!b.hidden()) {
                        utils.itemTiles(b, function(x, y) {
                            self._buildingsMap[y][x] = b;
                        }, ship);
                    }
                });

                this.changed = true;
            },
            get: function() {
                if (this._buildingsMap === null) {
                    this.update();
                }
                return this._buildingsMap;
            }
        };
        if (!settings.tmxName && !settings.jsonString) {
            throw 'Ship settings must have tmxName or jsonData';
        }
        if (settings.jsonString) {
            this.tmxName = JSON.parse(settings.jsonString).tmxName;
        } else {
            this.tmxName = settings.tmxName;
        }
        this.loadMap();

        this.width = this.tmxTileMap.width;
        this.height = this.tmxTileMap.height;
        this.syncWithGame = syncWithGame;
        this._buildings = [];
        if (settings.jsonString) {
            this.fromJsonString(settings.jsonString);
        }
    },
    loadMap : function() {
        this.tmxTileMap = new me.TMXTileMap(this.tmxName, 0, 0);
        this.tmxTileMap.load();
    },
    buildings : function() {
        return this._buildings;
    },
    units : function() {
        return _.filter(this._buildings, function(b){
            return b.name === 'unit';
        });
    },
    selected : function(){
        return _.filter(this.units(), function(u){
            return u.selected;
        });
    },
    //this should be called when the user builds something
    buildAt : function(x, y, buildingType) {
        var self = this,
        building = make.item(buildingType),
        canBuild = building.canBuildAt(x, y, this),
        canBuildRotated;
        if (!canBuild) {
            canBuildRotated = building.canBuildRotated(x, y, this);
            if (canBuildRotated) {
                building.rotated(true);
            }
        }
        if (canBuild || canBuildRotated) {
            building.x(x).y(y);
            //remove anything in its way
            utils.itemTiles(building, function(iX, iY) {
                self.removeAt(iX, iY);
            }, this);
            this.add(building);
            building.onBuilt();
            return building; //building successful
        }
        return null; //building failed
    },
    putUnit : function(settings) {
        'use strict';
        //find empty spot
        var empty = null, ship = this, unit;
        utils.matrixTiles(ship.width, ship.height,
            function(x, y) {
            if (empty) {
                return;
            }
            if (ship.mapAt(x, y) === charMap.codes._cleared) {
                empty = {x: x, y: y};
            }
        });
        unit = new Unit(empty.x, empty.y, settings);
        this.add(unit);
        return unit;
    },
    //Adds an item to the ship ignoring its placement rules
    add: function(item) {
        if (this.syncWithGame) {
            me.game.add(item, item.zIndex);
        }
        this._buildings.push(item);
        item.onShip(this);
        this.buildingsChanged();
    },
    removeAt: function(x, y) {
        //remove while is not string (is an item or unit)
        while (!(_.isString(this.mapAt(x, y)))) {
            this.remove(this.mapAt(x, y), true);
        }
    },
    remove: function(item, updateBuildings) {
        if (!item) {
            return;
        }
        if (updateBuildings === undefined) {
            updateBuildings = true; //updates by default
        }
        if (this.syncWithGame) {
            me.game.remove(item, true);
        }
        this._buildings.remove(item);
        if (updateBuildings) {
            this.buildingsChanged();
        }
    },

    removeAll: function() {
        var self = this,
            i;
        for (i = this.buildings().length - 1; i >= 0; i--) {
            self.remove(this.buildings()[i]);
        }
        this.buildingsChanged();
    },
    //to call whenever buildings change
    buildingsChanged: function() {
        this.buildingsMap.update();
        this.onBuildingsChanged();
    },
    onBuildingsChanged: function() {},

    map : function() {
        if (this.buildingsMap.changed || this.hullMap.changed ||
            this._map === null) {
            this._map = this._getJointMap();
            this.buildingsMap.changed = false;
            this.hullMap.changed = false;
        }
        return this._map;
    },
    mapAt: function(x, y) {
        if (this.map()[y] !== undefined && this.map()[y][x] !== undefined) {
            return this.map()[y][x];
        }
        return null;
    },
    isAt: function(x, y, name){
        var what = this.mapAt(x, y);
        return what && what.name === name;
    },
    isInside: function(x, y) {
        var tiles = charMap.codes,
            tile = this.mapAt(x, y);
        return tile !== tiles._solid && tile !== tiles._front &&
            tile !== tiles._back;
    },


    //joins hullMap and buildingsMap
    _getJointMap: function() {
        var self = this,
        joint = utils.getEmptyMatrix(this.width, this.height,
            charMap.codes._cleared);
        utils.matrixTiles(this.width, this.height,
            function(x, y) {
                joint[y][x] = self.hullMap.get()[y][x];
                if (self.buildingsMap.get()[y][x] !== charMap.codes._cleared) {
                    joint[y][x] = self.buildingsMap.get()[y][x];
                }
        });
        return joint;
    },
    toJsonString: function() {
        return JSON.stringify({
            'tmxName': this.tmxName,
            'buildings': _.map(this.buildings(), function(b) {
                            return {
                                name: b.name,
                                type: b.type,
                                x: b.x(),
                                y: b.y(),
                                rotated: b.rotated()
                            };})
            //TODO: clearly separate buildings and units
        });
    },
    fromJsonString: function(jsonString) {
        var obj, itemArray, item, i;
        this.removeAll();
        obj = JSON.parse(jsonString);
        itemArray = obj.buildings;
        for (i = 0; i < itemArray.length; i++) {
            if(itemArray[i].name === 'item') {
                item = make.item(itemArray[i].type);
                item.x(itemArray[i].x)
                    .y(itemArray[i].y)
                    .rotated(itemArray[i].rotated);
                this.add(item);
            } else if(itemArray[i].name === 'unit'){
                item = new Unit(itemArray[i].x, itemArray[i].y);
                this.add(item);
            } else{
                console.error('Invalid item in jsonString: ' +
                    JSON.stringify(itemArray[i]));
            }
        }
        this.buildingsChanged();
    },
    showInScreen: function() {
      me.levelDirector.loadLevel(this.tmxName);
        _.each(this.buildings(), function(b) {
            me.game.add(b, b.zIndex);
      });
    },
    getPfMatrix: function() {
        var ship = this,
            pfMatrix = utils.getEmptyMatrix(this.width, this.height, 1);
        utils.matrixTiles(this.width, this.height, function(x, y) {
            if (ship.map()[y][x] === charMap.codes._cleared ||
                ship.map()[y][x].name === 'unit') {
                pfMatrix[y][x] = 0; //cleared tiles and units are walkable
            }
        });
        return pfMatrix;
    }
});

