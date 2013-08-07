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
    var screen = battleScreen;

    function playMoveAction(action, unitVM) {
        var duration, tween;
        duration = action.end - action.start;
        unitVM.pos.x = action.from.x * TILE_SIZE;
        unitVM.pos.y = action.from.y * TILE_SIZE;
        tween = new me.Tween(unitVM.pos)
            .to({x: action.to.x * TILE_SIZE,
                y: action.to.y * TILE_SIZE}, duration);
        tween.start();
    }

    function playAction(action, unitVM){
        switch(action.variant) {
            case 'move': {
                 playMoveAction(action, unitVM);
            } break;
        }
    }



    this.loadScript = function(script){
        this.script = script;
        this.index = {};

    };


    this.update = function(elapsed){
        //TODO: Maybe don't organize actions by unit in the script.
        //actions for each unit
        var self = this;
        _.each(this.script, function(actions, unitID){
            var unit, unitVM, i;
            if(!self.index[unitID]) {
                self.index[unitID] = 0;
            }
            i = self.index[unitID];
            while(actions[i] && elapsed >= actions[i].start) {
                unit = gs.ship.getUnitByID(unitID);
                unitVM = screen.shipVM.getVM(unit);
                playAction(actions[i], unitVM);
                self.index[unitID]++;
                i = self.index[unitID];
            }
        })
    };
    this.draw = function(ctx){

    };
};
