/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global */

/**
 * Manages and reproduces actions on the screen
 * @type {*}
 */
var ScriptPlayer = function(battleScreen){
    var screen = battleScreen, script, lastExecuted = -1;

    function playMoveAction(action) {
        var duration, tween,
            unit = gs.ship.getUnitByID(action.unitID),
            unitVM = screen.shipVM.getVM(unit);
        duration = action.end - action.start;
        unitVM.pos.x = (action.from.x - unitVM.cannonTile[0]) * TILE_SIZE;
        unitVM.pos.y = (action.from.y - unitVM.cannonTile[1]) * TILE_SIZE;
        tween = new me.Tween(unitVM.pos)
            .to({x: (action.to.x - unitVM.cannonTile[0]) * TILE_SIZE,
                y: (action.to.y - unitVM.cannonTile[1]) * TILE_SIZE},
            duration);
        tween.start();
    }

    function playAction(action){
        switch(action.variant) {
            case 'move': {
                 playMoveAction(action);
            } break;
        }
    }

    this.loadScript = function(s){
        script = s;
    };


    this.update = function(elapsed){
        var i;
        for(i = lastExecuted + 1; i < script.length; i++) {
            if (elapsed >= script[i].start) {
                playAction(script[i]);
                lastExecuted = i;
            } else {
                break;
                //if the first is not yet due, that means none
                //are due because the script is ordered.
            }
        }
    };
    this.draw = function(ctx){

    };
};
