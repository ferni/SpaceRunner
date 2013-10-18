/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module, exports*/

var sh = require('../30_order-processing/30_verify-order'), _ = sh._;
if (typeof exports !== 'undefined') {
    /**
     * NodeJS exports
     * @type {*}
     */
    sh = module.exports = sh;
}

(function() {
    'use strict';
    var pfFinder = new sh.PF.AStarFinder({
            allowDiagonal: true,
            dontCrossCorners: true
        }),
        getTimeForMoving;

    getTimeForMoving = (function() {
        function getTileDistance(from, to) {
            var a = to.x - from.x,
                b = to.y - from.y;
            if (a === 0) {
                if (b < 0) {
                    return -b;
                }
                return b;
            }
            if (a < 0) {
                return -a;
            }
            return a;
        }

        function isDiagonal(from, to) {
            var a = to.x - from.x,
                b = to.y - from.y;
            return a !== 0 && b !== 0;
        }

        return function(unit, from, to) {
            var oneTileTime = unit.getTimeForOneTile(),
                diagonalTime = oneTileTime * 1.41421356,
                tileDistance,
                time;
            tileDistance = getTileDistance(from, to);
            if (isDiagonal(from, to)) {
                time = tileDistance * diagonalTime;
            } else {
                time = tileDistance * oneTileTime;
            }
            return time;
        };
    }());

    function insertByTime(array, item) {
        var insertionIndex = _.sortedIndex(array, item, 'time');
        array.splice(insertionIndex, 0, item);
    }

    function makeMoveAction(ship, time, data, queue) {
        var moveAction,
            pathIdx = data.index,
            path = data.path;
        moveAction = new sh.actions.Move({
            time: time,
            unitID: data.unit.id,
            from: data.from,
            to: data.to,
            duration: getTimeForMoving(data.unit, data.from, data.to)
        });
        pathIdx++;
        if (pathIdx < path.length) {
            insertByTime(queue, {
                time: time + moveAction.duration,
                type: 'Move',
                data: {
                    path: path,
                    index: pathIdx,
                    unit: data.unit,
                    from: {x: path[pathIdx - 1][0], y: path[pathIdx - 1][1]},
                    to: {x: path[pathIdx][0], y: path[pathIdx][1]}
                }
            });
        }

        return moveAction;
    }

    /**
     * Generates a "script" for the units given all the orders issued.
     * @param {Array} orders
     * @param {sh.Ship} ship
     * @param {int} turnDuration
     * @param {Boolean} turnOnly
     * @return {sh.Script}
     */
    function createScript(orders, ship, turnDuration, turnOnly) {
        var script = new sh.Script({turnDuration: turnDuration}),
            queue = [],//the actions that need to be added to the script
            grid = new sh.PF.Grid(ship.width, ship.height, ship.getPfMatrix()),
            next,
            action;

        function insertInQueue(item) {
            insertByTime(queue, item);
        }

        _.each(orders, function(order) {
            var unit = ship.getUnitByID(order.unitID),
                dest = order.destination,
                path;
            switch (order.variant) {
            case 'move':
                //this assumes the orders array is ordered by orders given
                path = pfFinder.findPath(unit.x, unit.y, dest.x, dest.y,
                    grid.clone());
                if (path.length > 1) {
                    insertInQueue({
                        time: 0,
                        type: 'Move',
                        data: {
                            path: path,
                            index: 1,
                            unit: unit,
                            from: {x: unit.x, y: unit.y},
                            to: {x: path[1][0], y: path[1][1]}
                        }
                    });
                }
                break;
            }
        });
        while (queue.length > 0 &&
                (!turnOnly || queue[0].time < turnDuration)) {
            next = queue[0];
            queue.shift();
            if (next.type === 'change') {
                //apply changes to the ship
                next.apply(ship);
            } else {
                //make according to next.type
                action = makeMoveAction(ship, next.time, next.data, queue);
                script.actions.push(action);
                _.each(action.modelChanges, insertInQueue);
            }


        }

        script.updateActionsByUnit();
        return script;
    }

    //export
    sh.createScript = createScript;
}());
