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
    init: function(x, y, settings){
        this.size = [1, 1];
        settings = this.completeSettings(settings);
        this.speed = settings.speed;
        this.type = settings.type;
        this.owner = settings.owner;
        this.parent(x, y);
    },
    completeSettings: function(settings){
        'use strict';
        if (!settings) {
            settings = {};
        }
        if (!settings.type) {
            settings.type = 0;
        }
        if(!settings.speed){
            settings.speed = 1;
        }
        return settings;
    },
    toJson: function(){
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            settings: {
                speed: this.speed,
                type: this.type,
                owner: this.owner.toJson()
            }

        };
    }
});