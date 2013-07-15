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
            var i, at;
            for (i = maps.length - 1; i >= 0; i--) {
                at = maps[i].at(x, y);
                if(at){
                    return at;
                }
            }
        };
    }
});
