/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global gs, me, TILE_SIZE, HALF_TILE, ui, _, draw, sh, utils*/

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

    function getPerpendicularDistanceToLane(point, lane) {
        //note: the point should be relative to the current tile
        var distance = {},
            dir = lane.direction;
        point = v.sub(point, lane.entryPoint); //make relative to entry point
        if (dir.x === 0) {
            return {x: -point.x, y: 0};
        }
        if (dir.y === 0) {
            return {x: 0, y: -point.y};
        }
        distance.y = ((point.x * (dir.y / dir.x)) - point.y) / 2;
        distance.x = ((point.y * (dir.x / dir.y)) - point.x) / 2;
        return distance;
    }

    function MoveActionPlayer(moveAction, elapsed) {
        var start, last, duration, unitVM, fromPx, toPx, advancementPerMs,
            lane, getInLaneTime, disToLane, advancementTowardsLanePerMs,
            isLast;
        start = elapsed;
        duration = moveAction.duration;
        unitVM = battleScreen.shipVM.getUnitVMByID(
            moveAction.unitID
        );
        isLast = script.getLastMoveAction(unitVM.m) === moveAction;
        if (isLast) {
            fromPx = unitVM.pos;
        } else {
            fromPx = v.mul(moveAction.from, TILE_SIZE);
        }

        toPx = v.mul(moveAction.to, TILE_SIZE);

        if (isLast) {
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
                    toPx.x += 24;
                    toPx.y += 8;
                } else {
                    //down left
                    toPx.x += 8;
                    toPx.y += 24;
                }
            } else {
                //go to the center of the tile.
                toPx.x += HALF_TILE;
                toPx.y += HALF_TILE;
            }
        }
        advancementPerMs = v.div(v.sub(toPx, fromPx), duration);

        //Movement lane
        if (!isLast) {
            lane = getLane(moveAction.from, moveAction.to);
            getInLaneTime = 300;
            disToLane = getPerpendicularDistanceToLane(
                //make relative to tile
                {x: unitVM.pos.x % 32, y: unitVM.pos.y % 32},
                lane
            );
            advancementTowardsLanePerMs = v.div(disToLane, getInLaneTime);
        }
        return {
            update: function(elapsedInTurn) {
                var index,
                    elapsed = elapsedInTurn - start,
                    delta = elapsed - (last || elapsed),
                    advance = v.mul(advancementPerMs, delta),
                    laneAdvance;
                //unitVM.pos is a me.Vector2d, that is why x and y
                //are assigned manually instead of using v.add
                unitVM.pos.x += advance.x;
                unitVM.pos.y += advance.y;
                if (!isLast && elapsed <= getInLaneTime) {
                    //move a little closer to the movement lane
                    laneAdvance = v.mul(advancementTowardsLanePerMs, delta);
                    unitVM.pos.x += laneAdvance.x;
                    unitVM.pos.y += laneAdvance.y;
                }
                last = elapsed;
                if (elapsed >= duration) {
                    //self remove from the actionPlayers
                    index = actionPlayers.indexOf(this);
                    actionPlayers.splice(index, 1);
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
            var floorPos = v.mul(utils.toTileVector(u.pos), TILE_SIZE),
                combatPos = u.isMine() ?
                        v.add(floorPos, mineCombatPos) :
                        v.add(floorPos, enemyCombatPos);
            movePerMs[index] = v.div(v.sub(combatPos, u.pos), moveDuration);
        });

        cloud = new me.ObjectEntity(action.tile.x * TILE_SIZE,
            action.tile.y * TILE_SIZE,
            {
                image: 'cloud',
                spritewidth: 32,
                spriteheight: 32
            });
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
            receiverVM.alpha = 0;
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

    //export for testing
    this.getPerpendicularDistanceToLane = getPerpendicularDistanceToLane;
};



