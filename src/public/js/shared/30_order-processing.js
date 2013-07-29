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


//TODO: verify that the player is in the order.battleID

var Action = sh.SharedClass.extendShared({
    unitID: null,
    start: 0,//ms
    finish: 0,//ms
    init: function(json) {
        this.start = json.start;
        this.finish = json.finish;
    }
});

sh.MoveAction = Action.extendShared({
    from:null,
    to:null,
    init: function(json) {
        this.parent(json);
        this.from = json.from;
        this.to = json.to;
    }
});



//should have access to the ship
sh.verifyOrder = function(order, ship, playerID){
    if(!order || !order.type || order.type !== 'Order-JSON-V1' ||
        !order.variant) {
        return false;
    }
    switch(order.variant) {
        case 'move' : {
            var dest = order.destination,
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


//SCRIPT GENERATION
var pfFinder = new sh.PF.AStarFinder({
    allowDiagonal: true
});
function pathToActionsArray(path, unit) {
    var actions = [], i,
        step = unit.getTimeForOneTile(),
        time = 0; //in ms
    for (i = 1; i < path.length; i++, time += step) {
        actions.push(new sh.MoveAction({
            from: path[i - 1],
            to: path[i],
            start: time,
            finish: time + step
        }));
    }
    return actions;
}

function createActionsFromMoveOrder(order, unit, grid) {
    var path,
        dest = order.destination,
        path = pfFinder.findPath(unit.x, unit.y, dest.x, dest.y, grid);
    console.log('path length: ' + (path.length - 1));
    if(path.length > 1) {
        //generate the actions
        return pathToActionsArray(path, unit);
    }
    return [];
};

/**
 * Generates a "script" for the units given all the orders issued.
 * @param orders
 * @param ship
 * @returns {{}}
 */
sh.createScript = function(orders, ship) {
    var script = {},
        grid = new sh.PF.Grid(ship.width, ship.height, ship.getPfMatrix());

    _.each(orders, function(order){
        var unit = ship.getUnitByID(order.unitID);
        if(!script[order.unitID]){
            script[order.unitID] = [];//array of Action
        }
        switch(order.variant) {
            case 'move': {
                //this assumes the orders array is ordered by orders given
                script[order.unitID] = script[order.unitID]
                    .concat(createActionsFromMoveOrder(order, unit, grid));
            }
        }
    });
    return script;
};

