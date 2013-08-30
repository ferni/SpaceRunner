/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global gs, me, TILE_SIZE*/

/**
 * Manages and reproduces actions on the screen
 * @type {*}
 * @param {*} battleScreen The battle screen.
 * @constructor
 */
var ScriptPlayer = function(battleScreen) {
    'use strict';
    var script, next;
    function playMoveAction(action) {
        var duration, tween,
            unit = gs.ship.getUnitByID(action.unitID),
            unitVM = battleScreen.shipVM.getVM(unit);
        duration = action.end - action.start;
        unitVM.pos.x = (action.from.x - unitVM.cannonTile[0]) * TILE_SIZE;
        unitVM.pos.y = (action.from.y - unitVM.cannonTile[1]) * TILE_SIZE;
        tween = new me.Tween(unitVM.pos)
            .to({x: (action.to.x - unitVM.cannonTile[0]) * TILE_SIZE,
                y: (action.to.y - unitVM.cannonTile[1]) * TILE_SIZE},
                duration);
        tween.start();
    }

    function playAction(action) {
        switch (action.variant) {
        case 'move':
            playMoveAction(action);
            break;
        }
    }

    this.loadScript = function(s) {
        script = s;
        next = 0;
    };


    this.update = function(elapsed) {
        var actions = script.actions;
        if (next < actions.length && elapsed >= actions[next].start) {
            if (script.isWithinTurn(actions[next])) {
                playAction(actions[next]);
            }
            next++;
        }
    };
    this.draw = function(ctx) {

    };
};
