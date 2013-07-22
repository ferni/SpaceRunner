/*
 -*- coding: utf-8 -*-
 * vim: set ts=4 sw=4 et sts=4 ai:
 * Copyright 2013 MITHIS
 * All rights reserved.
 */

/*global */

var sh = require('./09_shared-class'), _ = sh._,
    PF = sh.PF;
if(typeof exports !== 'undefined'){
    sh = module.exports = sh;
}

(function(sh){
    //SHARED ENTITIES
    sh.TestSharedEntity = sh.SharedClass.extendShared({});

    sh.Player = sh.SharedClass.extendShared({
        init: function(settings) {
            this.type = 'Player';
            this.id = settings.id;
            this.name = settings.name;
        },
        toJson: function(){
            return {
                type: this.type,
                id: this.id,
                name: this.name
            };
        }
    });

    sh.tiles = {
        solid: 's',
        front: 'f',
        back: 'b',
        clear: '.'
    };


    //should have access to the ship
    sh.verifyOrder = function(order, ship, playerID){
        switch(order.type) {
            case 'move' : {
                var dest = order.data.destination;
                //is destination a walkable area
                if(ship.at(dest.x, dest.y) === sh.tiles.clear &&
                    //unit owned by the issuer
                    order.unit.playerID === playerID){
                    return true;
                }else{
                    return false;
                }
            }
        }
    };
    sh.setUnitPath= function(unit, mouse) {
        'use strict';

        //TODO: convert to shared function (this function was directly copied from public)

        var grid, path,
            ship = gs.ship;
        if (mouse.x === unit.x && mouse.y === unit.y) {
            unit.path = [];
        } else {
            grid = new PF.Grid(ship.width, ship.height,
                ship.getPfMatrix());
            grid = this.processGrid(grid, unit, mouse);
            path = this.pfFinder.findPath(unit.x, unit.y,
                mouse.x, mouse.y, grid);
            console.log('path length: ' + (path.length - 1));
            if(path.length > 1) {
                unit.path = path;
            }
        }
    };
    sh.resolveOrders = function(orders) {
        var script;
        _.each(orders, function(unitOrders){
            //a set of orders for each unit
            var unitScript = {
                unitID : unitOrders.unitID,
                actions: []
            };
            _.each(unitOrders, function(order){
                switch(order.type) {
                    case 'move': {

                    }
                }
            });
        });
    };

    sh.mapNames = [
        'test',
        'cyborg_battleship1',
        'cyborg_cruiser',
        'cyborg_drone',
        'cyborg_frigate',
        'humanoid_battleship',
        'humanoid_cruiser',
        'humanoid_drone',
        'humanoid_frigate',
        'liquid_battleship',
        'liquid_cruiser',
        'liquid_drone',
        'liquid_frigate',
        'mechanoid_battleship',
        'mechanoid_cruiser',
        'mechanoid_drone',
        'mechanoid_frigate'
    ];

    //used in testing
    sh.getProperties = function(object) {
        var props = [], p;
        for(p in object ){
            props.push(p);
        }
        return props;
    };
})(sh);
