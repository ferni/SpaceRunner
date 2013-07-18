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

sh.Unit = sh.TileEntity.extendShared({
    init: function(x, y){
        this.size = [1, 1];
        this.type = 'unit';
        this.parent(x, y);
    },
    toJson: function(){
        return {
            x: this.x,
            y: this.y
        };
    }
});