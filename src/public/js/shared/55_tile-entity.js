/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me*/

var sh = require('./12_utils'), _ = sh._;
if(typeof exports !== 'undefined'){
    sh = module.exports = sh;
}

sh.TileEntity = sh.SharedClass.extendShared({
    init: function(x, y){
        this.x = x;
        this.y = y;
    },
    //takes rotation into account
    trueSize: function(index) {
        'use strict';
        //(only items can rotate, not units)
        return this.size[index];
    },
    //callback must have x and y. withinSize is optional
    tiles: function(callback ,withinSize) {
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
    //returns true is some part of the entity is occupying the tile
    occupies: function(x, y) {
        'use strict';
        var occupies = false;
        this.tiles(function(tX, tY) {
            if (x === tX && y === tY) {
                occupies = true;
            }
        });
        return occupies;
    }
});