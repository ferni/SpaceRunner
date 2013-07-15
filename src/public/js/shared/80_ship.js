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

sh.Ship = sh.SharedClass.extendShared({
    init: function(jsonString) {
        this.buildings = [];
        this.units = [];
        this.fromJsonString(jsonString);
    },
    addBuilding: function(building){
        this.buildings.push(building);
    },
    addUnit: function(unit) {
        this.units.push(unit);
    },
    toJsonString: function() {
        return JSON.stringify({
            'tmxName': this.tmxName,
            'buildings': this.buildings,
            'units': this.units
        });
    },
    fromJsonString: function(jsonString) {
        var json,
            ship = this;
        //ship.removeAll();
        json = JSON.parse(jsonString);
        this.tmxName = json.tmxName.toLowerCase();
        this.loadMap();
        _.each(json.buildings, function(b){
            ship.addBuilding(b);
        });
        _.each(json.units, function(u){
            ship.addUnit(u);
        });
    },
    loadMap : function(){
        var map = shipMaps[this.tmxName];
        if(typeof map === 'undefined') {
            throw new Error('tmx not found: '+ this.tmxName);
        }
        this.hullMap = map.hull;
        this.width = map.width;
        this.height = map.height;
    }
});