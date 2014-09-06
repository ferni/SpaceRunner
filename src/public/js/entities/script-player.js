/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global gs, me, TILE_SIZE, HALF_TILE, ui, _, draw, sh, utils, $*/

/**
 * Manages and reproduces actions on the screen
 * @type {*}
 * @param {*} battleScreen The battle screen.
 * @constructor
 */
var ScriptPlayer = function(battleScreen) {
    'use strict';
    var script, next,
        nextChange,
        modelChanges = [],
        v = sh.v; //vector math

    function playMoveAction(action) {
        var unitVM = battleScreen.shipVM.getUnitVMByID(
            action.unitID
        ),
            tilePx = v.mul(action.to, TILE_SIZE),
            toPx = v.add(tilePx, {x: 8, y: 8});//center
        unitVM.tweenTo(toPx, action.duration);
    }

    function playAttackAction(action) {
        var receiverVM = battleScreen.shipVM.getUnitVMByID(action.receiverID);
        battleScreen.shipVM
            .getUnitVMByID(action.attackerID)
            .playAttack(receiverVM.pos);
    }

    function playDamageShipAction(action) {
        var red = new ui.RedColorEntity(action.tile.x, action.tile.y),
            tween;
        me.game.add(red, ui.layers.colorOverlay);
        me.game.sort();
        tween = new me.Tween(red).to({alpha: 0}, 200).onComplete(function() {
            me.game.remove(red);
        });
        tween.start();
    }

    function playFireShipWeaponAction(action) {
        battleScreen.shipVM.getVM(
            gs.ship.getItemByID(action.weaponID)
        ).playFire();
    }

    function playAction(action) {
        switch (action.type) {
        case 'Move':
            playMoveAction(action);
            break;
        case 'Attack':
            playAttackAction(action);
            break;
        case 'DamageShip':
            playDamageShipAction(action);
            break;
        case 'FireShipWeapon':
            playFireShipWeaponAction(action);
            break;
        }
    }

    this.loadScript = function(s) {
        script = s;
        next = 0;
        nextChange = 0;
        modelChanges = script.getSortedModelChanges();
    };


    this.update = function(elapsed) {
        var actions = script.actions;

        //apply model changes to ship
        if (nextChange < modelChanges.length &&
                elapsed >= modelChanges[nextChange].time &&
                //same condition as in 40_create-script.js
                //(queue[0].time <= turnDuration)
                modelChanges[nextChange].time <= script.turnDuration) {
            modelChanges[nextChange].apply(gs.battle);
            _.invoke(battleScreen.shipVM.unitVMs, 'notifyModelChange');
            nextChange++;
        }

        //play actions
        if (next < actions.length && elapsed >= actions[next].time) {
            if (script.isWithinTurn(actions[next])) {
                playAction(actions[next], elapsed);
            }
            next++;
        }
    };

    this.onPause = function() {
        var declareWinner;
        //finish applying remaining model changes
        for (nextChange; nextChange < modelChanges.length; nextChange++) {
            //same condition as in 40_create-script.js
            //(queue[0].time <= turnDuration)
            if (modelChanges[nextChange].time <= script.turnDuration) {
                modelChanges[nextChange].apply(gs.battle);
            }
        }
        _.invoke(battleScreen.shipVM.unitVMs, 'notifyModelChange');
        //clean up
        gs.battle.endOfTurnReset();

        if (script) {
            declareWinner = _.find(script.actions, function(a) {
                return a instanceof sh.actions.DeclareWinner;
            });
            if (declareWinner) {
                if (declareWinner.playerID === gs.player.id) {
                    alert('Victory!');
                } else {
                    alert('Defeat.');
                }
                location.reload();
            }
        }
    };

};



