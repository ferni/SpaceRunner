/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global gs, me, TILE_SIZE, ui*/

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
        duration = action.duration;
        unitVM.pos.x = (action.from.x - unitVM.cannonTile[0]) * TILE_SIZE;
        unitVM.pos.y = (action.from.y - unitVM.cannonTile[1]) * TILE_SIZE;
        tween = new me.Tween(unitVM.pos)
            .to({x: (action.to.x - unitVM.cannonTile[0]) * TILE_SIZE,
                y: (action.to.y - unitVM.cannonTile[1]) * TILE_SIZE},
                duration);
        tween.start();
    }

    function playAttackAction(action) {
        var receiver = gs.ship.getUnitByID(action.receiverID),
            receiverVM = battleScreen.shipVM.getVM(receiver);
        me.game.add(new ui.StarHit(receiverVM), 2000);
        me.game.add(new ui.FloatingNumber(receiverVM.pos, -(action.damage)),
            2000);
        me.game.sort();

        console.log('Unit ' + action.attackerID + ' hit ' + action.receiverID +
            ' with ' + action.damage + ' damage!');
    }

    function playAction(action) {
        switch (action.type) {
        case 'Move':
            playMoveAction(action);
            break;
        case 'Attack':
            playAttackAction(action);
            break;
        }
    }

    this.loadScript = function(s) {
        script = s;
        next = 0;
    };


    this.update = function(elapsed) {
        var actions = script.actions;
        if (next < actions.length && elapsed >= actions[next].time) {
            if (script.isWithinTurn(actions[next])) {
                playAction(actions[next]);
            }
            next++;
        }
    };
};
