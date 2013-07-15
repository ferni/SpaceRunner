/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me*/

var sh = require('./60_items'), _ = sh._;
if(typeof exports !== 'undefined'){
    sh = module.exports = sh;
}

sh.EntityMap = function(width, height, entityArray){
    this.changed = true;
    this.map = null;
    this.width = width;
    this.height = height;
    this.update = function(entityArray) {
        var self = this;

        if(!entityArray) {
            throw 'entityArray parameter mandatory.';
        }
        self.map = sh.utils.getEmptyMatrix(this.width,
            this.height, 0);
        _.each(entityArray, function(e) {
            e.tiles(function(x, y) {
                self.map[y][x] = e;
            }, {width: self.width, height: self.height});
        });

        this.changed = true;
    };
    this.update(entityArray);
};

/**
 * Does pretty much nothing but implement the EntityMap interface
 * (For using in CompoundMap).
 * @param map {Array} the map.
 * @constructor
 */
sh.StaticMap = function(map) {
    this.map = map;
    this.width = map[0].length;
    this.height = map.length;
    this.update = function(){};
    this.changed = false;
};