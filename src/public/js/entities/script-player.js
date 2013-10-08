/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global gs, me, TILE_SIZE, ui, _, draw, sh*/

/**
 * Manages and reproduces actions on the screen
 * @type {*}
 * @param {*} battleScreen The battle screen.
 * @constructor
 */
var ScriptPlayer = (function() {
    'use strict';
    var v = sh.v, //vector math
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

    return function(battleScreen) {
        var script, next, actionPlayers;

        function MoveActionPlayer(moveAction, elapsed) {
            var start = elapsed,
                last,
                duration = moveAction.duration,
                unit = gs.ship.getUnitByID(moveAction.unitID),
                unitVM = battleScreen.shipVM.getVM(unit),
                fromPx = v.mul(moveAction.from, TILE_SIZE),
                toPx = v.mul(moveAction.to, TILE_SIZE),
                advancementPerMs = v.div(v.sub(toPx, fromPx), duration),

                //vars related to sticking to a movement "lane":
                lane = getLane(moveAction.from, moveAction.to),
                getInLaneTime = 300, //(ms)
                disToLane = getPerpendicularDistanceToLane(
                    //make relative to tile
                    {x: unitVM.pos.x % 32, y: unitVM.pos.y % 32},
                    lane
                ),
                advancementTowardsLanePerMs = v.div(disToLane, getInLaneTime);

            return {
                update: function(elapsedInTurn) {
                    var index,
                        elapsed = elapsedInTurn - start,
                        delta = elapsed - (last || elapsed),
                        advance = v.mul(advancementPerMs, delta),
                        laneAdvance = v.mul(advancementTowardsLanePerMs, delta);
                    //unitVM.pos is a me.Vector2d, that is why x and y
                    //are assigned manually instead of using v.add
                    unitVM.pos.x += advance.x;
                    unitVM.pos.y += advance.y;
                    if (elapsed <= getInLaneTime) {
                        //move a little closer to the movement lane
                        unitVM.pos.x += laneAdvance.x;
                        unitVM.pos.y += laneAdvance.y;
                    }
                    last = elapsed;
                    if (elapsed >= duration) {
                        //self remove from the actionPlayers
                        index = actionPlayers.indexOf(this);
                        actionPlayers.splice(index, 1);
                    }
                }
            };
        }

        function LockInCombatActionPlayer(action, elapsed) {
            var start = elapsed,
                last;

            return {
                update: function(elapsedInTurn) {
                    var elapsed = elapsedInTurn - start,
                        delta = elapsed - (last || elapsed),
                        index;
                    //noinspection JSValidateTypes

                    me.game.sort();
                    last = elapsed;

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

        function playAction(action, elapsed) {
            switch (action.type) {
            case 'Move':
                actionPlayers.push(new MoveActionPlayer(action, elapsed));
                break;
            case 'Attack':
                playAttackAction(action);
                break;
            case 'LockInCombat':
                me.game.add(new ui.RedColorEntity(action.tile.x,
                    action.tile.y), 3000);
                /*actionPlayers.push(new LockInCombatActionPlayer(action,
                    elapsed));            */
                break;
            }
        }

        this.loadScript = function(s) {
            script = s;
            next = 0;
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

}());



