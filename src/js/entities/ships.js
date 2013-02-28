/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, charMap, utils, _ */

function Ship(tmxTileMap, syncWithGame) {
    'use strict';
    this.tmxTileMap = tmxTileMap;
    if (!this.tmxTileMap.initiated) {
        this.tmxTileMap.load();
    }
    this.width = this.tmxTileMap.width;
    this.height = this.tmxTileMap.height;
    this.syncWithGame = syncWithGame;
    this._buildings = [];
    this.init = function() {
    };
    this.buildings = function() {
        return this._buildings;
    };
    //this should be called when the user builds something
    this.buildAt = function(x, y, buildingType) {
        var self = this,
        building = utils.makeItem(buildingType),
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
            }, true);
            this.add(building);
            building.onBuilt();
            return building; //building successful
        }
        return null; //building failed
    };

    //Adds an item to the ship ignoring its placement rules
    this.add = function(item) {
        if (this.syncWithGame) {
            me.game.add(item, item.zIndex);
        }
        this._buildings.push(item);
        item.onShip(true);
        this.buildingsChanged();
    };
    this.removeAt = function(x, y) {
        while (this.mapAt(x, y).name === 'item') {
            this.remove(this.mapAt(x, y), true);
        }
    };
    this.remove = function(item, updateBuildings) {
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
    };

    this.removeAll = function() {
        var self = this,
            i;
        for (i = this.buildings().length - 1; i >= 0; i--) {
            self.remove(this.buildings()[i]);
        }
        this.buildingsChanged();
    };
    //to call whenever buildings change
    this.buildingsChanged = function() {
        this.buildingsMap.update();
        this.onBuildingsChanged();
    };
    this.onBuildingsChanged = function() {};
    this._map = null;
    this.map = function() {
        if (this.buildingsMap.changed || this.hullMap.changed ||
            this._map === null) {
            this._map = this._getJointMap();
            this.buildingsMap.changed = false;
            this.hullMap.changed = false;
        }
        return this._map;
    };
    this.mapAt = function(x, y) {
        if (this.map()[y] !== undefined && this.map()[y][x] !== undefined) {
            return this.map()[y][x];
        }
        return null;
    };
    this.buildingsMap = {
        thisShip: this,
        changed: true,
        _buildingsMap: null,
        update: function() {
            var self = this;
            self._buildingsMap = utils.getEmptyMatrix(self.thisShip.width,
                self.thisShip.height, charMap.codes._cleared);
            _.each(self.thisShip.buildings(), function(b) {
                if (!b.hidden()) {
                    utils.itemTiles(b, function(x, y) {
                        self._buildingsMap[y][x] = b;
                    }, true);
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
    this.hullMap = {
        thisShip: this,
        changed: true,
        _hullMap: null,
        update: function() {
            this._hullMap = charMap.get(this.thisShip.tmxTileMap);
            this._changed = true;
        },
        get: function() {
            if (this._hullMap === null) {
                this.update();
            }
            return this._hullMap;
        }
    };
    //joins hullMap and buildingsMap
    this._getJointMap = function() {
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
    };
    this.toJsonString = function() {
        return JSON.stringify(_.map(this.buildings(), function(b) {
            return {
                type: b.type,
                x: b.x(),
                y: b.y(),
                rotated: b.rotated()
            };
        }));
    };
    this.fromJsonString = function(jsonString) {
        var itemArray, item, i;
        this.removeAll();
        itemArray = JSON.parse(jsonString);
        for (i = 0; i < itemArray.length; i++) {
            item = utils.makeItem(itemArray[i].type);
            item.x(itemArray[i].x)
                .y(itemArray[i].y)
                .rotated(itemArray[i].rotated);
            this.add(item);
        }
        this.buildingsChanged();
    };
    this.init();
}

