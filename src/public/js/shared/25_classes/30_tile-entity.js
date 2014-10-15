/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, require, module, exports*/

var sh = require('../25_classes/25_player'), _ = sh._;
if (typeof exports !== 'undefined') {
    /**
     * NodeJS exports
     * @type {*}
     */
    sh = module.exports = sh;
}

/**
 * An object on the ship. (An item, an unit, etc)
 * @type {*}
 */
sh.TileEntity = sh.Jsonable.extendShared({
    id: null, //the ship is in charge of setting the id
    init: function(json) {
        'use strict';
        this.setJson({
            type: 'TileEntity',
            properties: ['id', 'x', 'y'],
            json: json
        });
    },
    //takes rotation into account
    trueSize: function(index) {
        'use strict';
        //(only items can rotate, not units)
        return this.size[index];
    },
    //callback must have x and y. withinSize is optional
    tiles: function(callback, withinSize) {
        'use strict';
        var x, y,
            width = this.trueSize(0),
            height = this.trueSize(1);
        for (x = this.x; x < width + this.x &&
                (!withinSize || x < withinSize.width) && x >= 0; x++) {
            for (y = this.y; y < height + this.y &&
                    (!withinSize || y < withinSize.height) && y >= 0; y++) {
                callback(x, y);
            }
        }
    },
    getTiles: function() {
        'use strict';
        var tiles = [], x, y,
            width = this.trueSize(0),
            height = this.trueSize(1);
        for (x = this.x; x < width + this.x && x >= 0; x++) {
            for (y = this.y; y < height + this.y && y >= 0; y++) {
                tiles.push({x: x, y: y});
            }
        }
        return tiles;
    },
    //returns true is some part of the entity is occupying the tile
    occupies: function(tile) {
        'use strict';
        var x = tile.x, y = tile.y;
        return x >= this.x && x < this.x + this.trueSize(0) &&
            y >= this.y && y < this.y + this.trueSize(1);
    }
});
