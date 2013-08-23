/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me*/

var sh = require('./65_make'), _ = sh._;
if(typeof exports !== 'undefined'){
    sh = module.exports = sh;
}

/**
 * An Array2d.
 * @type {*}
 */
sh.Map = sh.SharedClass.extendShared({
    init: function(raw){
        //check consistent width
        var i, width;
        if (!raw) {
            throw 'raw parameter mandatory.';
        }
        width = raw[0].length;
        for(i = raw.length - 2; i >= 0; i--) {
            if(raw[i].length !== width) {
                throw 'the raw map has not consistent width';
            }
        }
        this.width = width;
        this.height = raw.length;
        this.at = function(x, y) {
            return raw[y] !== undefined ? raw[y][x]: undefined;
        };
        this.set = function(x, y, value) {
            if(this.isInBounds(x, y)) {
                raw[y][x] = value;
            }else{
                throw 'Cannot set map at ' + x +',' + y+': out of bounds.';
            }
        };
        this.clear = function(){
            this.tiles(function(x, y){
                raw[y][x] = 0;
            });
        };
    },
    isInBounds: function(x, y){
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    },
    tiles: function(callback){
        var y, x;
        for(y = this.height - 1; y >= 0; y--) {
            for(x = this.width - 1; x >= 0; x--) {
                callback(x, y);
            }
        }
    }
});

sh.EntityMap = sh.Map.extendShared({
    init: function(width, height, entityArray){
        this.parent(sh.utils.getEmptyMatrix(width, height, 0));
        this.changed = true;
        this.entities = entityArray;
        this.update();
    },
    update: function() {
        var self = this;
        this.clear();
        _.each(this.entities, function(e) {
            e.tiles(function(x, y) {
                self.set(x, y, e);
            }, self);
        });
        this.changed = true;
    }
});

/**
 * Each tile holds an array of entities.
 * @type {*}
 */
sh.EntityMap3d = sh.Map.extendShared({
    init: function(width, height, entityArray){
        this.parent(sh.utils.getEmptyMatrix(width, height, 0));
        this.changed = true;
        this.entities = entityArray;
        this.update();
    },
    update: function() {
        var self = this;
        this.clear();
        _.each(this.entities, function(e) {
            e.tiles(function(x, y) {
                if(!self.at(x, y)) {
                    self.set(x, y, []);
                }
                self.at(x, y).push(e);
            }, self);
        });
        this.changed = true;
    }
});

sh.CompoundMap = sh.Map.extendShared({
    init: function(maps){
        if(!maps){
            throw 'maps parameter mandatory.';
        }
        //check sizes
        (function(){
            var width = maps[0].width,
                height = maps[0].height,
                i;
            for(i = 1; i < maps.length; i++) {
                if(maps[i].width !== width ||
                    maps[i].height !== height) {
                    throw 'Maps for Compound should be the same size.';
                }
            }
        })();
        this.width = maps[0].width;
        this.height = maps[0].height;
        this.at = function(x, y){
            var i, what;
            for (i = maps.length - 1; i >= 0; i--) {
                what = maps[i].at(x, y);
                if(what){
                    return what;
                }
            }
        };
    }
});

