/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global _*/

var sh = require('./00_init'), _ = sh._;
if(typeof exports !== 'undefined'){
    sh = module.exports = sh;
}

sh.pr = {
    PlacementRule: function(settings) { //settings: tile, inAny, inAll
        'use strict';
        var wantedTile;
        //sugar for tileSatisfies = function(tile){return tile == <tile>;}
        this.tile = settings.tile;
        this.inAny = settings.inAny;// Array of {x,y} (relative coordinates)
        this.inAll = settings.inAll;// Array of {x,y} (relative coordinates)
        this.tileCondition = settings.tileCondition; // function(tile)
        if (this.tileCondition === undefined && this.tile !== undefined) {
            wantedTile = this.tile;
            this.tileCondition = function(tile) {
                return tile === wantedTile;
            };
        }
        this.compliesAt = function(x, y, map) {
            return pr.utils.checkAny(map, this.tileCondition, this.inAny, {
                x: x,
                y: y
            }) && pr.utils.checkAll(map, this.tileCondition, this.inAll, {
                x: x,
                y: y
            });
        };
    },
    make: {
        //has to have enough space
        spaceRule: function(tileCondition, width, height) {
           'use strict';
            var coordArray = [], x, y, settings;
            for (y = 0; y < height; y++) {
                for (x = 0; x < width; x++) {
                    coordArray.push({
                        x: x,
                        y: y
                    });
                }
            }
            settings = {
                inAll: coordArray
            };
            if (_.isFunction(tileCondition)) {
                settings.tileCondition = tileCondition;
            }
            else {
                settings.tile = tileCondition; //tileCondition is just a tile
            }
            return new pr.PlacementRule(settings);
        },
        //has to be next to something
        nextToRule: function(tileCondition, width, height) {
            'use strict';
            var coordArray = [], x, y, settings;
            for (x = 0; x < width; x++) {
                coordArray.push({
                    x: x,
                    y: -1
                }); //top
                coordArray.push({
                    x: x,
                    y: height
                }); //bottom
            }
            for (y = 0; y < height; y++) {
                coordArray.push({
                    x: -1,
                    y: y
                }); //left
                coordArray.push({
                    x: width,
                    y: y
                }); //right
            }
            settings = {
                inAny: coordArray
            };
            if (_.isFunction(tileCondition)) {
                settings.tileCondition = tileCondition;
            }
            else {
                settings.tile = tileCondition; //tileCondition is just a tile
            }
            return new pr.PlacementRule(settings);
        }
    },
    utils: {
        //check if a tile is at any of the positions in "relativeCoords"
        checkAny: function(tileMap, condition, relativeCoords, currentCoord) {
            'use strict';
            return pr.utils.checkAnyOrAll(tileMap, condition, relativeCoords,
                currentCoord, true);
        },
        //check if a tile is at all of the positions in "relativeCoords"
        checkAll: function(tileMap, condition, relativeCoords, currentCoord) {
            'use strict';
            return pr.utils.checkAnyOrAll(tileMap, condition, relativeCoords,
                currentCoord, false);
        },
        checkAnyOrAll: function(tileMap, tileCondition, relativeCoordinates,
                currentCoordinate, inAny) {
            'use strict';
            var coor, wantedTileCoordinate, row, tileAtCoordinate;
            if (!relativeCoordinates || relativeCoordinates.length === 0) {
                return true;
            }
            for (coor = 0; coor < relativeCoordinates.length; coor++) {
                wantedTileCoordinate = relativeCoordinates[coor];
                row = tileMap[currentCoordinate.y + wantedTileCoordinate.y];
                tileAtCoordinate = null;
                if (row) {
                    tileAtCoordinate =
                        row[currentCoordinate.x + wantedTileCoordinate.x];
                }
                if (inAny && tileAtCoordinate &&
                    tileCondition(tileAtCoordinate)) {
                    return true;
                }
                if (!inAny && (!tileAtCoordinate ||
                    !tileCondition(tileAtCoordinate))) {
                    return false;
                }
            }
            return !inAny;
        }

    }
};

