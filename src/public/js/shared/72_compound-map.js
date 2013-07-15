/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global */

var sh = require('./70_entity-map'), _ = sh._;
if(typeof exports !== 'undefined'){
    sh = module.exports = sh;
}


/**
 *
 * @param maps {Array} An array of EntityMap, StaticMap or CompoundMap
 * @constructor
 */
sh.CompoundMap = function(maps){
    var maps = maps;

    this.map = null;
    this.changed = true;
    if (!maps) {
        return;
    }
    //check same size
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

    this.update = function(){
        var someChanged = false, i, self = this;
        _.each(maps, function(m){
            if(m.changed) {
                someChanged = true;
                m.changed = false;
            }
        });
        if(someChanged) {
            //generate
            this.map = sh.utils.getEmptyMatrix(this.width, this.height, 0);
            for(i = 0; i < maps.length; i++) {
                sh.utils.matrixTiles(this.width, this.height, function(x, y) {
                    if(maps[i].map[y][x]) {
                        self.map[y][x] = maps[i].map[y][x];
                    }
                });
            }
        }
        this.changed = true;
    };

};