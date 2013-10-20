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

    function MoveActionPlayer(moveAction, elapsed) {
        var start, last, duration, unitVM, fromPx, toPx, advancementPerMs,
            advancementPerMsToEnd,
            lane, isLast, timeForEndPos, endPos, tilePx, totalDuration;
        start = elapsed;
        totalDuration = duration = moveAction.duration;
        unitVM = battleScreen.shipVM.getUnitVMByID(
            moveAction.unitID
        );
        isLast = script.getLastMoveAction(unitVM.m) === moveAction;
        fromPx = unitVM.pos;
        tilePx = v.mul(moveAction.to, TILE_SIZE);
        lane = getLane(moveAction.from, moveAction.to);
        //adjust for entry point
        toPx = v.add(tilePx, lane.entryPoint);
        if (script.byUnit[unitVM.m.id][0] === moveAction) { //first one
            unitVM.setCurrentAnimation('walking', false);
        }
        if (isLast) { //is last move action the unit would take this turn
            //split duration between going to entry point and going to end pos
            timeForEndPos = duration / 4;
            /*if (timeForEndPos < 150) {
                timeForEndPos = 150;
            }*/
            duration -= timeForEndPos;
            if (_.any(script.actions, function(action) {
                    //there's a "lock in combat" action ahead
                    return action instanceof sh.actions.LockInCombat &&
                        (action.unit1ID === moveAction.unitID ||
                        action.unit2ID === moveAction.unitID) &&
                        v.equal(action.tile, moveAction.to);
                })) {
                //go to the combat position
                if (unitVM.isMine()) {
                    //up right
                    endPos = v.add(tilePx, {x: 24, y: 8});
                } else {
                    //down left
                    endPos = v.add(tilePx, {x: 8, y: 24});
                }
            } else {
                //go to the center of the tile.
                endPos = v.add(tilePx, {x: HALF_TILE, y: HALF_TILE});
            }
            advancementPerMsToEnd = v.div(v.sub(endPos, toPx), timeForEndPos);
        }
        advancementPerMs = v.div(v.sub(toPx, fromPx), duration);
        return {
            update: function(elapsedInTurn) {
                var index,
                    elapsed = elapsedInTurn - start,
                    delta = elapsed - (last || elapsed),
                    advance = duration <= elapsed && isLast ?
                            v.mul(advancementPerMsToEnd, delta) :
                            v.mul(advancementPerMs, delta),
                    prevPosX = unitVM.pos.x;
                //unitVM.pos is a me.Vector2d, that is why x and y
                //are assigned manually instead of using v.add

                if (elapsed >= totalDuration) {
                    if (isLast) {
                        unitVM.setCurrentAnimation('idle', true);
                        console.log('Unit positioned in ' + timeForEndPos +
                            'ms');
                    }


                    //self remove from the actionPlayers
                    index = actionPlayers.indexOf(this);
                    actionPlayers.splice(index, 1);

                } else {
                    unitVM.pos.x += advance.x;
                    unitVM.pos.y += advance.y;
                    unitVM.faceLeft(prevPosX - unitVM.pos.x > 0);
                    last = elapsed;
                }
            },
            onNextTurn: function() {}
        };
    }

    function LockInCombatActionPlayer(action, elapsed) {
        var start = elapsed,
            last,
            cloud,
            leftToEnd = script.turnDuration - elapsed,
            mineCombatPos = {x: 24, y: 8},
            enemyCombatPos = {x: 8, y: 24},
            moveDuration = leftToEnd < 200 && leftToEnd > 0 ?
                    leftToEnd : 200,
            units = [],
            movePerMs = [];
        units[0] = battleScreen.shipVM.getUnitVMByID(action.unit1ID);
        units[1] = battleScreen.shipVM.getUnitVMByID(action.unit2ID);
        _.each(units, function(u, index) {
            var floorPos, combatPos;
            floorPos = v.mul(utils.toTileVector(u.pos), TILE_SIZE);
            if (u.isMine()) {
                combatPos = v.add(floorPos, mineCombatPos);
                u.faceLeft(true);
            } else {
                combatPos = v.add(floorPos, enemyCombatPos);
                u.faceLeft(false);
            }
            movePerMs[index] = v.div(v.sub(combatPos, u.pos), moveDuration);
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
                var elapsed, delta;
                elapsed = elapsedInTurn - start;
                delta = elapsed - (last || elapsed);
                if (elapsed <= moveDuration) {
                    _.each(units, function(u, index) {
                        var move = v.mul(movePerMs[index], delta);
                        u.pos.x += move.x;
                        u.pos.y += move.y;

                    });
                }
                cloud.angle += 0.1;
                if (units[0].isDead || units[1].isDead) {
                    me.game.remove(cloud, false);
                    actionPlayers.splice(actionPlayers.indexOf(this), 1);
                }
                last = elapsed;
            },
            onNextTurn: function() {
                me.game.remove(cloud, false);
            }
        };
    }

    function playAttackAction(action) {
        var receiver = gs.ship.getUnitByID(action.receiverID),
            receiverVM = battleScreen.shipVM.getVM(receiver),
            attacker = gs.ship.getUnitByID(action.attackerID),
            attackerVM = battleScreen.shipVM.getVM(attacker);

        //temporary hack until the script generation is improved
        //for processing deaths.
        if (attackerVM.isDead || receiverVM.isDead) {
            return;
        }
        if (receiverVM.hp === undefined) {
            receiverVM.hp = receiver.maxHP;
        }
        receiverVM.hp -= action.damage;
        if (receiverVM.hp <= 0) {
            receiverVM.isDead = true;
            receiverVM.setCurrentAnimation('dead');
            receiverVM.alpha = 0.8;
        }
        //end of temporary hack

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
            actionPlayers.push(new MoveActionPlayer(action, elapsed));
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
        _.each(actionPlayers, function(ap) {
            ap.onNextTurn();
        });
        actionPlayers = [];
    };


    this.update = function(elapsed) {
        var actions = script.actions;
        if (next < actions.length && elapsed >= actions[next].time) {
            if (script.isWithinTurn(actions[next])) {
                playAction(actions[next], elapsed);
            }
            next++;
        }
        _.each(actionPlayers, function(ap) {
            ap.update(elapsed);
        });
    };
};



