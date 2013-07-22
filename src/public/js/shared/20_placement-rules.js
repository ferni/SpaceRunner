/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global _*/

var sh = require('./12_utils'), _ = sh._;
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
            if(!(map instanceof sh.Map)){
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
            }
            else {
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
            }
            else {
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
                currentCoordinate, inAny) {
            'use strict';
            var coor, wantedTileCoordinate, row, tileAtCoordinate;
            if (!relativeCoordinates || relativeCoordinates.length === 0) {
                return true;
            }
            for (coor = 0; coor < relativeCoordinates.length; coor++) {
                wantedTileCoordinate = relativeCoordinates[coor];
                tileAtCoordinate = tileMap.at(currentCoordinate.x + wantedTileCoordinate.x,
                    currentCoordinate.y + wantedTileCoordinate.y);
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

//add prebuilt placement rules for items
(function(){
    var pr = sh.pr,
        space1x1 = pr.make.spaceRule(sh.tiles.clear, 1, 1),
        space2x1 = pr.make.spaceRule(sh.tiles.clear, 2, 1),
        space1x2 = pr.make.spaceRule(sh.tiles.clear, 1, 2),
        space2x2 = pr.make.spaceRule(sh.tiles.clear, 2, 2),
        prebuiltSpace = [[space1x1, space1x2],[space2x1, space2x2]];

    pr.space = function(width, height){
        if(!prebuiltSpace[width - 1] ||
            !prebuiltSpace[width - 1][height - 1]) {
            throw "There's no prebuilt space rule for size "
                + width +'x' + height;
        }
        return prebuiltSpace[width - 1][height - 1];
    };

    function and (ruleA, ruleB) {
        return {
            compliesAt: function(x, y, map){
                return ruleA.compliesAt(x, y, map) &&
                    ruleB.compliesAt(x, y, map);
            }
        }
    };
    function or (ruleA, ruleB) {
        return {
            compliesAt: function(x, y, map){
                return ruleA.compliesAt(x, y, map) ||
                    ruleB.compliesAt(x, y, map);
            }
        }
    };

    //SPECIAL PLACEMENT RULES FOR ITEMS

    pr.weapon = and(space2x2, new sh.pr.PlacementRule({
        tile: sh.tiles.front,
        inAny: [{
            x: 2,
            y: 0
        }, {
            x: 2,
            y: 1
        }]
    }));

    pr.engine = and(space2x2, new sh.pr.PlacementRule({
        tile: sh.tiles.back,
        inAll: [{
            x: -1,
            y: 0
        }, {
            x: -1,
            y: 1
        }]
    }));

    pr.console = and(space1x1, sh.pr.make.nextToRule(function(tile) {
        return tile.type === 'weapon' || tile.type === 'engine' ||
            tile.type === 'power';
    }, 1, 1));

    pr.door = or(pr.make.spaceRule(function(tile) {
            return tile instanceof sh.items.Wall && tile.isHorizontal();
        }, 2, 1),
        //or...
        and(space2x1,
            //and...
            new pr.PlacementRule({tileCondition: function(tile) {
                return tile instanceof sh.items.Wall;
            }, inAll:[{x: -1, y: 0}, {x: 2, y:0}]}))
    );

    pr.doorRotated = or(pr.make.spaceRule(function(tile) {
            return tile instanceof sh.items.Wall && tile.isVertical();
        }, 1, 2),
        and(space1x2,
            new pr.PlacementRule({tileCondition: function(tile) {
                return tile instanceof sh.items.Wall;
            }, inAll:[{x: 0, y: -1}, {x: 0, y: 2}]})));


})();