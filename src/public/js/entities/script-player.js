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
        v = sh.v, //vector math
        moveThroughRightLane = false,
        movementLanes = (function() {
            var tile = TILE_SIZE, quarter = TILE_SIZE / 4;
            return {
                right: {
                    direction: {x: 1, y: 0},
                    entryPoint: {x: 0, y: tile - quarter}
                },
                left: {
                    direction: {x: -1, y: 0},
                    entryPoint: {x: tile, y: quarter}
                },
                down: {
                    direction: {x: 0, y: 1},
                    entryPoint: {x: quarter, y: 0}
                },
                up: {
                    direction: {x: 0, y: -1},
                    entryPoint: {x: tile - quarter, y: tile}
                },
                right_down: {
                    direction: {x: 1, y: 1},
                    entryPoint: {x: 0, y: quarter}
                },
                left_down: {
                    direction: {x: -1, y: 1},
                    entryPoint: {x: tile - quarter, y: 0}
                },
                left_up: {
                    direction: {x: -1, y: -1},
                    entryPoint: {x: tile, y: tile - quarter}
                },
                right_up: {
                    direction: {x: 1, y: -1},
                    entryPoint: {x: quarter, y: tile}
                }
            };
        }());

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
            lane, toPx;
        if (moveThroughRightLane) {
            lane = getLane(action.from, action.to);
            //adjust for entry point
            toPx = v.add(tilePx, lane.entryPoint);
        } else {
            toPx = v.add(tilePx, {x: 8, y: 8});//center
        }
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
        /*console.log('attacked with the ship. starting time: ' +
            gs.ship.getUnitByID(action.unitID).chargingShipWeapon.startingTime +
            ' turn elapsed: ' + battleScreen.elapsed);*/
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
        case 'DeclareWinner':
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
        //play actions
        if (next < actions.length && elapsed >= actions[next].time) {
            if (script.isWithinTurn(actions[next])) {
                playAction(actions[next], elapsed);
            }
            next++;
        }

        //apply model changes to ship
        if (nextChange < modelChanges.length &&
                elapsed >= modelChanges[nextChange].time &&
                //same condition as in 40_create-script.js
                //(queue[0].time <= turnDuration)
                modelChanges[nextChange].time <= script.turnDuration) {
            modelChanges[nextChange].apply(gs.ship);
            _.invoke(battleScreen.shipVM.unitVMs, 'notifyModelChange');
            nextChange++;
        }

    };

    this.onPause = function() {
        var declareWinner;
        //finish applying remaining model changes
        for (nextChange; nextChange < modelChanges.length; nextChange++) {
            //same condition as in 40_create-script.js
            //(queue[0].time <= turnDuration)
            if (modelChanges[nextChange].time <= script.turnDuration) {
                modelChanges[nextChange].apply(gs.ship);
            }
        }
        _.invoke(battleScreen.shipVM.unitVMs, 'notifyModelChange');
        //clean up
        gs.ship.endOfTurnReset(battleScreen.turnDuration);

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



