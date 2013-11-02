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
        });

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
            duration: data.unit.getTimeForMoving(data.from, data.to)
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
