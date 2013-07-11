/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, hullMap, utils, _ */

var Ship = Object.extend({
    hullMap: {},
    buildingsMap: {},
    _map : null,
    init : function(settings, syncWithGame) {
        'use strict';
        var ship = this;
        this.buildingsMap = {
            changed: true,
            _buildingsMap: null,
            update: function() {
                var self = this;
                self._buildingsMap = utils.getEmptyMatrix(ship.width,
                    ship.height, sh.tiles.clear);
                _.each(ship.buildings(), function(b) {
                    if (!b.hidden()) {
                        b.tiles(function(x, y) {
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
        this.hullMap = hullMap.get(this.tmxTileMap);
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
        building = make.itemModel(buildingType),
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
            this.add(building);
            building.onBuilt();
            return building; //building successful
        }
        return null; //building failed
    },
    //finds a clear spot and creates a new unit there
    putUnit : function(settings) {
        'use strict';
        //find empty spot
        var empty = null, ship = this, unit;
        utils.matrixTiles(ship.width, ship.height,
            function(x, y) {
            if (empty) {
                return;
            }
            if (ship.mapAt(x, y) === sh.tiles.clear) {
                empty = {x: x, y: y};
            }
        });
        unit = new Unit(empty.x, empty.y, settings);
        this.add(unit);
        return unit;
    },
    //Adds an item to the ship ignoring its placement rules
    add: function(item) {
        var VMConstructor, vm;
        if (this.syncWithGame) {
            VMConstructor = make.itemTypes[item.type];
            if (!VMConstructor) {
                throw 'Could not find view model of type ' + item.type;
            }
            vm = new VMConstructor(item);
            me.game.add(vm, vm.zIndex);
        }
        this._buildings.push(item);
        item.onShip(this);
        //the following two lines are just for the wall
        vm.onShip(this);
        vm.onBuilt();
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
        //(disable remove from MelonJS for now)
        /*
        if (this.syncWithGame) {
            me.game.remove(item, true);
        } */
        this._buildings.remove(item);
        if (updateBuildings) {
            this.buildingsChanged();
        }
    },

    removeAll: function() {
        var self = this,
            i;
        for (i = this.buildings().length - 1; i >= 0; i--) {
            //TODO: don't update buildings here (pass false as 2nd parameter)
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
        if (this.buildingsMap.changed  ||
            this._map === null) {
            this._map = this._getJointMap();
            this.buildingsMap.changed = false;
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
        var tile = this.mapAt(x, y);
        return tile !== sh.tiles.solid && tile !== sh.tiles.front &&
            tile !== sh.tiles.back;
    },


    //joins hullMap and buildingsMap
    _getJointMap: function() {
        var self = this,
        joint = utils.getEmptyMatrix(this.width, this.height,
            sh.tiles.clear);
        utils.matrixTiles(this.width, this.height,
            function(x, y) {
                joint[y][x] = self.hullMap[y][x];
                if (self.buildingsMap.get()[y][x] !== sh.tiles.clear) {
                    joint[y][x] = self.buildingsMap.get()[y][x];
                }
        });
        return joint;
    },
    toJsonString: function() {
        return JSON.stringify({
            'tmxName': this.tmxName,
            'buildings': _.map(_.filter(this.buildings(), function(b) {
                return b.name === 'item';
            }), function(b) { return b.toJson();}),
            'units': _.map(this.units(),
                function(u) { return u.toJson();}
            )
            //TODO: clearly separate buildings and units
        });
    },
    fromJsonString: function(jsonString) {
        var json,
            ship = this;
        ship.removeAll();
        json = JSON.parse(jsonString);
        _.each(json.buildings, function(b){
            ship.add(make.itemFromJson(b));
        });
        _.each(json.units, function(u){
            ship.add(make.unitFromJson(u));
        });
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
            if (ship.map()[y][x] === sh.tiles.clear ||
                ship.map()[y][x].name === 'unit') {
                pfMatrix[y][x] = 0; //clear tiles and units are walkable
            }
        });
        return pfMatrix;
    }
});

