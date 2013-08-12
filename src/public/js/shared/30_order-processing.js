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
(function(){
    'use strict';

    //The following classes serve as documentation only,
    //the json counterparts are being used instead.
    var Action = sh.SharedClass.extendShared({
        unitID: null,
        start: 0,//ms
        end: 0,//ms
        init: function(json) {
            this.start = json.start;
            this.end = json.end;
        }
    }),
    TURN_DURATION = 3000;//TODO: maybe set this somewhere else and propagate it

    sh.MoveAction = Action.extendShared({
        from:null,
        to:null,
        init: function(json) {
            this.parent(json);
            this.from = json.from;
            this.to = json.to;
        }
    });



    sh.verifyOrder = function(order, ship, playerID){
        if(!order || !order.type || order.type !== 'Order-JSON-V1' ||
            !order.variant) {
            return false;
        }
        switch(order.variant) {
            case 'move' : {
                var dest = order.destination,
                    unit = ship.getUnitByID(order.unitID);
                return unit &&
                    //is destination a walkable area
                    ship.isWalkable(dest.x, dest.y) &&
                    //unit owned by the issuer
                    unit.owner.id === playerID;
            } break;
            default: return false;
        }
    };


    //SCRIPT GENERATION
    var pfFinder = new sh.PF.AStarFinder({
        allowDiagonal: true
    });

    function getTileDistance(from, to) {
        var a = to.x - from.x,
            b = to.y - from.y;
        if(a === 0) {
            if(b < 0) {
                return -b;
            }
            return b;
        }
        if(a < 0) {
            return -a;
        }
        return a;
    }

    function isDiagonal(from, to) {
        var a = to.x - from.x,
            b = to.y - from.y;
        return a !== 0 && b !== 0;
    }

    function convertPathToActionsArray(path, unit) {
        var action,
            actions = [], i,
            oneTileTime = unit.getTimeForOneTile(),
            diagonalTime = oneTileTime * 1.41421356,
            tileDistance,
            step,
            time = 0; //in ms
        for (i = 1; i < path.length; i++, time += step) {
            action = {
                type: 'Action',
                variant: 'move',
                unitID: unit.id,
                from: {
                    x: path[i - 1][0],
                    y: path[i - 1][1]
                },
                to: {
                    x: path[i][0],
                    y: path[i][1]
                },
                start: time
            };
            tileDistance = getTileDistance(action.from, action.to);
            if(isDiagonal(action.from, action.to)) {
                step = tileDistance * diagonalTime;
            }else{
                step = tileDistance * oneTileTime;
            }
            action.end = action.start + step;
            actions.push(action);
        }
        return actions;
    }

    function createActionsFromMoveOrder(order, unit, grid) {
        var dest = order.destination,
            path = pfFinder.findPath(unit.x, unit.y, dest.x, dest.y, grid);
        if(path.length > 0) {
            //generate the actions
            return convertPathToActionsArray(path, unit);
        }
        return [];
    }

    function willUnitMove(unitID, actionsByUnit) {
        return _.any(actionsByUnit[unitID], function(action){
            return action.variant === 'move';
        });
    }

    function getActionsByUnit(script) {
        var actions = {};
        _.each(script, function(action){
            if(typeof action.unitID !== 'undefined') {
                if(!actions[action.unitID]){
                    actions[action.unitID] = [];
                }
                actions[action.unitID].push(action);
            }
        });
        return actions;
    }

    sh.fixActionsOverlap = function(actions) {
        var i, diff;
        for(i = 0; i < actions.length - 1; i++) {
            if(actions[i + 1].start < actions[i].end) {
                diff = actions[i].end - actions[i + 1].start;
                actions[i + 1].start += diff;
                actions[i + 1].end += diff;
            }
        }
    };

    function applySpeedModifiers(script, ship){
        var actionsByUnit = getActionsByUnit(script);
        _.each(actionsByUnit, function(actions, unitID) {
            var unit = ship.getUnitByID(unitID),
                changed = false;
            _.each(actions, function(action){
                var otherUnit, duration;
                if(action.variant === 'move') {
                    otherUnit = ship.map.at(action.from.x, action.from.y);
                    if(otherUnit instanceof sh.Unit &&
                        //is enemy unit
                        otherUnit.owner.id !== unit.owner.id &&
                        //unit will stand still
                        !willUnitMove(otherUnit.id, actionsByUnit)){

                        //apply %25 speed
                        duration = action.end - action.start;
                        duration *= 4;
                        action.end = action.start + duration;
                        changed = true;
                    }
                }
            });
            if(changed) {
                sh.fixActionsOverlap(actions);
            }
        });
    }


    function insertDelay(actions, index, delay){
        var i;
        for (i = actions.length - 1; i >= index; i--) {
            actions[index].start += delay;
            actions[index].end += delay;
        }
    }


    /*
    NOTES:

    If an action start time is less than the turn duration,
    it gets executed, even if that means that the action is
    finishing executing after the timer has stopped. This means
    that a unit's end position is indicated by the "to" property
    of the last executed action.

     */
    function isActionWithinTurn(action, turnDuration) {
        return action.start < turnDuration;
    }

    function getLastMoveAction(actions) {
        var moveActions = _.filter(actions, function(a){
            return a.variant === 'move' &&
                isActionWithinTurn(a, TURN_DURATION);
        });
        if(moveActions && moveActions.length > 0) {
            return moveActions[moveActions.length - 1];
        }
        return null;
    }

    function getEndPosition(unit, actionsByUnit) {
        var lastMoveAction = getLastMoveAction(actionsByUnit[unit.id]);
        return lastMoveAction ? lastMoveAction.to : {x: unit.x, y: unit.y};
    }

    sh.fixEndOfTurnOverlap = function(script, ship) {
        var actionsByUnit = getActionsByUnit(script),
            i, j, a, b, forChange, somethingChanged,
                actions, lastMoveAction;
        do{
            somethingChanged = false;
            for (i = ship.units.length - 1; i >= 0; i--) {
                a = ship.units[i];
                for (j = i - 1; j >= 0; j--) {
                    b = ship.units[j];
                    if(a.owner.id === b.owner.id && //unis are of the same team
                        _.isEqual(getEndPosition(a, actionsByUnit),
                        getEndPosition(b, actionsByUnit))) {
                        //same end position, one will need to change
                        if(willUnitMove(a.id, actionsByUnit)){
                            //change a, since it's the one moving
                            forChange = a;
                        }else if(willUnitMove(b.id, actionsByUnit)) {
                            //change b, since it's the one moving
                            forChange = b;
                        }else {
                            throw 'Neither unit is moving yet they ended' +
                                ' up in the same position, something' +
                                ' has gone wrong...';
                        }
                        actions = actionsByUnit[forChange.id];
                        lastMoveAction = getLastMoveAction(actions);
                        insertDelay(actions,
                            actions.indexOf(lastMoveAction),
                            TURN_DURATION - lastMoveAction.start);
                        somethingChanged = true;
                    }
                }
            }
        }while(somethingChanged);
    };

    /**
     * Generates a "script" for the units given all the orders issued.
     * @param orders
     * @param ship
     * @returns {[]}
     */
    sh.createScript = function(orders, ship) {
        //TODO: make it async
        var script = [],
            grid = new sh.PF.Grid(ship.width, ship.height, ship.getPfMatrix());

        _.each(orders, function(order){
            var unit = ship.getUnitByID(order.unitID), actions;
            switch(order.variant) {
                case 'move': {
                    //this assumes the orders array is ordered by orders given
                    actions = createActionsFromMoveOrder(order, unit, grid.clone());
                    script = script.concat(actions);
                } break;
            }
        });
        script = _.sortBy(script, 'start');
        applySpeedModifiers(script, ship);
        sh.fixEndOfTurnOverlap(script, ship);
        return script;
    };

    /**
     * Modifies the ship and its elements according with the script given
     * and the time.
     * @param ship
     * @param script
     * @param time
     */
    sh.updateShipByScript = function(ship, script, time) {
        //TODO: leverage the fact that the actions are ordered by time
        _.each(script, function(action){
            var unit;
            if(action.start < time) {
                //this assumes the action involves a unit
                unit = ship.getUnitByID(action.unitID);
                unit.x = action.to.x;
                unit.y = action.to.y;
            }
        });
        ship.unitsMap.update();
    };
})();

