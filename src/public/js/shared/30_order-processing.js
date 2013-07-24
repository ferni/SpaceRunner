/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me*/

var sh = require('./20_placement-rules'), _ = sh._;
if(typeof exports !== 'undefined'){
    sh = module.exports = sh;
}

//should have access to the ship
sh.verifyOrder = function(order, ship, playerID){
    if(!order || !order.type) return false;
    switch(order.type) {
        case 'move' : {
            var dest = order.data.destination,
                unit = ship.getUnitByID(order.unitID);
            if(unit &&
                //is destination a walkable area
                ship.at(dest.x, dest.y) === sh.tiles.clear &&
                //unit owned by the issuer
                unit.owner.id === playerID){
                return true;
            }else{
                return false;
            }
        }; break;
        default: return false;
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
