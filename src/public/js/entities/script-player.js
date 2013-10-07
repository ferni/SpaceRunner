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
                entryPoint: {x: 0, y: 8}//in pixels
            },
            left: {
                direction: {x: -1, y: 0},
                entryPoint: {x: 32, y: 24}//in pixels
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

    function isInLane(pixelPos, lane) {
        var dir, corrected;
        if (v.equal(pixelPos, lane.entryPoint)) {
            return true;
        }
        dir = lane.direction;
        corrected = v.sub(pixelPos, lane.entryPoint);
        return dir.x === 0 ?
                corrected.x / corrected.y === dir.x / dir.y :
                corrected.y / corrected.x === dir.y / dir.x;
    }

    function drawLanes(ctx) {
        gs.ship.map.tiles(function(x, y) {
            var pixX = x * TILE_SIZE,
                pixY = y * TILE_SIZE;
            _.each(movementLanes, function(l) {
                var nextX = (x + l.direction[0]) * TILE_SIZE,
                    nextY = (y + l.direction[1]) * TILE_SIZE;
                draw.line(ctx,
                    {x: pixX + l.entryPoint[0], y: pixY + l.entryPoint[1]},
                    {x: nextX + l.entryPoint[0], y: nextY + l.entryPoint[1]},
                    'white', 1);
            });
        });
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
                lane = getLane(moveAction.from, moveAction.to),
                advancementTowardsLanePerMs;



            return {
                update: function(elapsedInTurn) {
                    var index,
                        elapsed = elapsedInTurn - start,
                        delta = elapsed - (last || elapsed),
                        advance = v.mul(advancementPerMs, delta);
                    unitVM.pos = v.add(unitVM.pos, advance);
                    last = elapsed;
                    if (elapsed >= duration) {
                        index = actionPlayers.indexOf(this);
                        actionPlayers.splice(index, 1);
                    }
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
        this.getLane = getLane;
        this.isInLane = isInLane;
    };

}());


