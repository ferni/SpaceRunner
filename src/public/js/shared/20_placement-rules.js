/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module*/

var sh = module.exports,
    _ = require('underscore')._,
    Map = require('./25_classes/40_map').Map,
    items = require('./25_classes/32_items').items,
    gen = require('./10_general-stuff'),
    tiles = gen.tiles,
    GRID_SUB = gen.GRID_SUB;

/**
 * Library for facilitating configuring the rules for placement for the items.
 * @type {{PlacementRule: Function, make: {spaceRule: Function, nextToRule: Function}, utils: {checkAny: Function, checkAll: Function, checkAnyOrAll: Function}}}
 */
sh.pr = {
    /**
     * A placement rule
     * @param {{tile:{Object}, inAny:{Array}, inAll:{Array}}} settings
     * @constructor
     */
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
            if (!(map instanceof Map)) {
                throw 'map should be an instance of sh.Map';
            }
            return sh.pr.utils.checkAny(map, this.tileCondition, this.inAny, {
                x: x,
                y: y
            }) && sh.pr.utils.checkAll(map, this.tileCondition, this.inAll, {
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
            } else {
                settings.tile = tileCondition; //tileCondition is just a tile
            }
            return new sh.pr.PlacementRule(settings);
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
            } else {
                settings.tile = tileCondition; //tileCondition is just a tile
            }
            return new sh.pr.PlacementRule(settings);
        }
    },
    utils: {
        //check if a tile is at any of the positions in "relativeCoords"
        checkAny: function(tileMap, condition, relativeCoords, currentCoord) {
            'use strict';
            return sh.pr.utils.checkAnyOrAll(tileMap, condition, relativeCoords,
                currentCoord, true);
        },
        //check if a tile is at all of the positions in "relativeCoords"
        checkAll: function(tileMap, condition, relativeCoords, currentCoord) {
            'use strict';
            return sh.pr.utils.checkAnyOrAll(tileMap, condition, relativeCoords,
                currentCoord, false);
        },
        checkAnyOrAll: function(tileMap, tileCondition, relativeCoordinates,
                currentCoord, inAny) {
            'use strict';
            var coor, wantedTileCoord, tileAtCoord;
            if (!relativeCoordinates || relativeCoordinates.length === 0) {
                return true;
            }
            for (coor = 0; coor < relativeCoordinates.length; coor++) {
                wantedTileCoord = relativeCoordinates[coor];
                tileAtCoord = tileMap.at(currentCoord.x + wantedTileCoord.x,
                    currentCoord.y + wantedTileCoord.y);
                if (inAny && tileAtCoord &&
                        tileCondition(tileAtCoord)) {
                    return true;
                }
                if (!inAny && (!tileAtCoord ||
                    !tileCondition(tileAtCoord))) {
                    return false;
                }
            }
            return !inAny;
        }

    }
};

//add prebuilt placement rules for items
(function() {
    'use strict';
    function s(value) {
        return value * GRID_SUB;
    }
    var pr = sh.pr,
        space1x1 = pr.make.spaceRule(tiles.clear, s(1), s(1)),
        space2x1 = pr.make.spaceRule(tiles.clear, s(2), s(1)),
        space1x2 = pr.make.spaceRule(tiles.clear, s(1), s(2)),
        space2x2 = pr.make.spaceRule(tiles.clear, s(2), s(2));

    function and(ruleA, ruleB) {
        return {
            compliesAt: function(x, y, map) {
                return ruleA.compliesAt(x, y, map) &&
                    ruleB.compliesAt(x, y, map);
            }
        };
    }
    function or(ruleA, ruleB) {
        return {
            compliesAt: function(x, y, map) {
                return ruleA.compliesAt(x, y, map) ||
                    ruleB.compliesAt(x, y, map);
            }
        };
    }

    //SPECIAL PLACEMENT RULES FOR ITEMS

    pr.weapon = and(space2x2, new sh.pr.PlacementRule({
        tile: tiles.front,
        inAny: [{
            x: s(2),
            y: s(0)
        }, {
            x: s(2),
            y: s(1)
        }]
    }));

    pr.Engine = and(space2x2, new sh.pr.PlacementRule({
        tile: tiles.back,
        inAll: [{
            x: s(-1),
            y: s(0)
        }, {
            x: s(-1),
            y: s(1)
        }]
    }));

    pr.console = and(space1x1, sh.pr.make.nextToRule(function(tile) {
        return tile.type === 'Weapon' || tile.type === 'Engine' ||
            tile.type === 'Power';
    }, s(1), s(1)));

    pr.door = or(pr.make.spaceRule(function(tile) {
        return tile instanceof items.Wall && tile.isHorizontal();
    }, s(2), s(1)),
        //or...
        and(space2x1,
            //and...
            new pr.PlacementRule({tileCondition: function(tile) {
                return tile instanceof items.Wall;
            }, inAll: [{x: s(-1), y: s(0)}, {x: s(2), y: s(0)}]}))
        );

    pr.doorRotated = or(pr.make.spaceRule(function(tile) {
        return tile instanceof items.Wall && tile.isVertical();
    }, s(1), s(2)),
        and(space1x2,
            new pr.PlacementRule({tileCondition: function(tile) {
                return tile instanceof items.Wall;
            }, inAll: [{x: s(0), y: s(-1)}, {x: s(0), y: s(2)}]})));
}());
