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

sh.EntityMap = sh.SharedClass.extendShared({
    changed: true,
    map: null,
    init: function(width, height, entityArray){
        this.width = width;
        this.height = height;
        this.update(entityArray);
    },
    update: function(entityArray) {
        var self = this;
        if(!entityArray) {
            throw 'entityArray parameter mandatory.';
        }
        self.map = sh.utils.getEmptyMatrix(this.width,
            this.height, sh.tiles.clear);
        _.each(entityArray, function(e) {
            e.tiles(function(x, y) {
                self.map[y][x] = e;
            }, {width: self.width, height: self.height});
        });

        this.changed = true;
    }
});