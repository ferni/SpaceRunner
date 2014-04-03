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
        clouds = [],
        v = sh.v, //vector math
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
            lane = getLane(action.from, action.to),
            //adjust for entry point
            toPx = v.add(tilePx, lane.entryPoint);
        unitVM.tweenTo(toPx, action.duration);
    }

    function playLockInCombatAction(action) {
        var mineCombatPos = {x: 24, y: 8},
            enemyCombatPos = {x: 8, y: 24},
            units = [],
            cloud;

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

        //add a cloud over the tile
        if (!_.any(clouds, function(c) {
                return sh.v.equal(c.tile, action.tile);
            })) {
            cloud = new ui.Cloud(action.tile);
            clouds.push({
                tile: action.tile,
                cloud: cloud
            });
            me.game.add(cloud, ui.layers.effects);
        }
    }

    function playEndCombatAction(action) {
        var cloudRegistry = _.find(clouds, function(c) {
            return sh.v.equal(c.tile, action.tile);
        });
        if (cloudRegistry) {//there's actually a cloud there
            clouds.splice(_.indexOf(clouds, cloudRegistry), 1);
            me.game.remove(cloudRegistry.cloud, true);
        }
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
        case 'LockInCombat':
            playLockInCombatAction(action);
            break;
        case 'EndCombat':
            playEndCombatAction(action);
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
        case 'FireShipWeapon':
            playFireShipWeaponAction(action);
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
                //(queue[0].time < turnDuration)
                modelChanges[nextChange].time < script.turnDuration) {
            modelChanges[nextChange].apply(gs.ship);
            _.invoke(battleScreen.shipVM.unitVMs, 'notifyModelChange');
            nextChange++;
        }

        _.each(actionPlayers, function(ap) {
            ap.update(elapsed);
        });
    };

    this.onPause = function() {
        //finish applying remaining model changes
        for (nextChange; nextChange < modelChanges.length; nextChange++) {
            //same condition as in 40_create-script.js
            //(queue[0].time < turnDuration)
            if (modelChanges[nextChange].time < script.turnDuration) {
                modelChanges[nextChange].apply(gs.ship);
            }
        }
        _.invoke(battleScreen.shipVM.unitVMs, 'notifyModelChange');
        //clean up
        gs.ship.endOfTurnReset(battleScreen.turnDuration);
    };

};



