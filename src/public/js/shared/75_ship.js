﻿/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module*/

var sh = require('./70_map'), _ = sh._;
if(exports !== undefined){
    sh = module.exports = sh;
}

sh.Ship = sh.SharedClass.extendShared({
    hullMap: {},
    itemsMap: {},
    init : function(settings) {
        'use strict';
        if (!settings.tmxName && !settings.jsonString) {
            throw 'Ship settings must have tmxName or jsonData';
        }
        if (settings.jsonString) {
            this.tmxName = JSON.parse(settings.jsonString).tmxName;
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
        if (settings.jsonString) {
            this.fromJsonString(settings.jsonString);
        }
    },
    loadMap : function() {
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
    buildAt : function(x, y, buildingType) {
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
    putUnit : function(settings) {
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
        unit = new sh.Unit(empty.x, empty.y, settings);
        this.addUnit(unit);
        return unit;
    },
    //Adds an item to the ship ignoring its placement rules
    addItem: function(item) {
        this.built.push(item);
        item.onShip(this);
        this.buildingsChanged();
    },
    addUnit: function(unit) {
        this.units.push(unit);
        unit.ship = this;
        unit.id = this.units.length;
        this.unitsMap.update();
    },
    getUnitByID: function(id) {
        return _.find(this.units, function(u){
            return u.id == id;
        });
    },
    removeAt: function(x, y) {
        //remove while is not string (is an item or unit)
        while (!(_.isString(this.at(x, y)))) {
            this.remove(this.at(x, y), true);
        }
    },
    remove: function(item, updateBuildings) {
        if (!item) {
            return;
        }
        if (updateBuildings === undefined) {
            updateBuildings = true; //updates by default
        }
        this.built.remove(item);
        if (updateBuildings) {
            this.buildingsChanged();
        }
    },
    removeAll: function() {
        var self = this,
            i;
        for (i = this.built.length - 1; i >= 0; i--) {
            self.remove(this.built[i], false);
        }
        this.buildingsChanged();
    },
    //to call whenever buildings change
    buildingsChanged: function() {
        this.itemsMap.update();
        this.onBuildingsChanged();
    },
    onBuildingsChanged: function() {},
    at: function(x, y) {
        return this.map.at(x, y);
    },
    hasUnits: function(position){
        return this.unitsMap.at(position.x, position.y);
    },
    isInside: function(x, y) {
        var tile = this.at(x, y);
        return tile !== sh.tiles.solid && tile !== sh.tiles.front &&
            tile !== sh.tiles.back;
    },
    toJsonString: function() {
        return JSON.stringify({
            'tmxName': this.tmxName,
            'buildings': _.map(this.built, function(b) {
                return b.toJson();
            }),
            'units': _.map(this.units, function(u) {
                return u.toJson();}
            )
        });
    },
    fromJsonString: function(jsonString) {
        var json,
            ship = this;
        ship.removeAll();
        json = JSON.parse(jsonString);
        _.each(json.buildings, function(b){
            ship.addItem(sh.make.itemFromJson(b));
        });
        _.each(json.units, function(u){
            ship.addUnit(sh.make.unitFromJson(u));
        });
        this.buildingsChanged();
    },
    getPfMatrix: function() {
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
        var tile = this.map.at(x, y);
        //clear tiles and units are walkable
        return  tile === sh.tiles.clear || this.hasUnits({x: x, y: y});
    }
});

