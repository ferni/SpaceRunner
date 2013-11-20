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
    var script, next, actionPlayers = [],
        nextChange,
        modelChanges = [],
        v = sh.v, //vector math
        movementLanes = {
            right: {
                direction: {x: 1, y: 0},
                entryPoint: {x: 0, y: 24}//in pixels
            },
            left: {
                direction: {x: -1, y: 0},
                entryPoint: {x: 32, y: 8}//in pixels
            },
            down: {
                direction: {x: 0, y: 1},
                entryPoint: {x: 8, y: 0}//in pixels
            },
            up: {
                direction: {x: 0, y: -1},
                entryPoint: {x: 24, y: 32}//in pixels
            },
            right_down: {
                direction: {x: 1, y: 1},
                entryPoint: {x: 0, y: 8}
            },
            left_down: {
                direction: {x: -1, y: 1},
                entryPoint: {x: 24, y: 0}
            },
            left_up: {
                direction: {x: -1, y: -1},
                entryPoint: {x: 32, y: 24}
            },
            right_up: {
                direction: {x: 1, y: -1},
                entryPoint: {x: 8, y: 32}
            }
        };

    function sign(x) { return x ? x < 0 ? -1 : 1 : 0; }
    function getLane(from, to) {
        var diff = v.sub(to, from),
            signs = v.map(diff, sign);
        return _.find(movementLanes, function(l) {
            return v.equal(l.direction, signs);
        });
    }

    function playMoveAction(action) {
        var unitVM = battleScreen.shipVM.getUnitVMByID(
            action.unitID
        ),
            tilePx = v.mul(action.to, TILE_SIZE),
            lane = getLane(action.from, action.to),
            //adjust for entry point
            toPx = v.add(tilePx, lane.entryPoint);
        unitVM.tweenTo(toPx, action.duration);
    }

    function LockInCombatActionPlayer(action, elapsed) {
        var cloud,
            mineCombatPos = {x: 24, y: 8},
            enemyCombatPos = {x: 8, y: 24},
            units = [];

        units[0] = battleScreen.shipVM.getUnitVMByID(action.unit1ID);
        units[1] = battleScreen.shipVM.getUnitVMByID(action.unit2ID);
        _.each(units, function(u) {
            var floorPos, combatPos;
            floorPos = v.mul(action.tile, TILE_SIZE);
            if (u.isMine()) {
                combatPos = v.add(floorPos, mineCombatPos);
            } else {
                combatPos = v.add(floorPos, enemyCombatPos);
            }
            u.tweenTo(combatPos, 700, me.Tween.Easing.Quadratic.EaseOut);
        });

        cloud = new me.ObjectEntity(
            action.tile.x * TILE_SIZE,
            action.tile.y * TILE_SIZE,
            {
                image: 'cloud',
                spritewidth: 32,
                spriteheight: 32
            }
        );
        cloud.alpha = 0.3;
        //noinspection JSValidateTypes
        me.game.add(cloud, 1800);
        me.game.sort();
        return {
            update: function(elapsedInTurn) {
                cloud.angle += 0.1;
            },
            onNextTurn: function() {

                me.game.remove(cloud, false);
            }
        };
    }

    function playAttackAction(action) {
        var receiver = gs.ship.getUnitByID(action.receiverID),
            receiverVM = battleScreen.shipVM.getVM(receiver);

        me.game.add(new ui.StarHit(receiverVM), 2000);
        me.game.add(new ui.FloatingNumber(receiverVM.pos, -(action.damage)),
            2000);
        me.game.sort();

        console.log('Unit ' + action.attackerID + ' hit ' +
            action.receiverID + ' with ' + action.damage + ' damage!');
    }

    function playDamageShipAction(action) {
        console.log('The ship received ' + action.damage + ' damage!');
        var red = new ui.RedColorEntity(action.tile.x, action.tile.y),
            tween;
        me.game.add(red, 1000);
        me.game.sort();
        tween = new me.Tween(red).to({alpha: 0}, 200).onComplete(function() {
            me.game.remove(red);
        });
        tween.start();
        battleScreen.shipVM.hp -= action.damage;
        $('#hp').html('[' + battleScreen.shipVM.hp + ']');
    }


    function playAction(action, elapsed) {
        switch (action.type) {
        case 'Move':
            playMoveAction(action);
            break;
        case 'Attack':
            playAttackAction(action);
            break;
        case 'LockInCombat':
            actionPlayers.push(new LockInCombatActionPlayer(action,
                elapsed));
            break;
        case 'DamageShip':
            playDamageShipAction(action);
            break;
        case 'DeclareWinner':
            if (action.playerID === gs.player.id) {
                alert('Victory!');
            } else {
                alert('Defeat.');
            }
            location.reload();
            break;
        }
    }

    this.loadScript = function(s) {
        script = s;
        next = 0;
        nextChange = 0;
        _.each(actionPlayers, function(ap) {
            ap.onNextTurn();
        });
        actionPlayers = [];
        modelChanges = script.getSortedModelChanges();

        _.each(battleScreen.shipVM.unitVMs, function(u) {
            if (script.byUnit[u.m.id]) {
                u.lastPos = _.last(script.byUnit[u.m.id]).to;
            }
        });
    };


    this.update = function(elapsed) {
        var actions = script.actions;
        //play actions
        if (next < actions.length && elapsed >= actions[next].time) {
            if (script.isWithinTurn(actions[next])) {
                playAction(actions[next], elapsed);
            }
            next++;
        }

        //apply model changes to ship
        if (nextChange < modelChanges.length &&
                elapsed >= modelChanges[nextChange].time) {
            modelChanges[nextChange].apply(gs.ship);
            nextChange++;
        }

        _.each(actionPlayers, function(ap) {
            ap.update(elapsed);
        });
    };

    this.onPause = function() {
        //finish applying remaining model changes
        for (nextChange; nextChange < modelChanges.length; nextChange++) {
            modelChanges[nextChange].apply(gs.ship);
        }
        //clean up
        gs.ship.endOfTurnReset();
    };

};



