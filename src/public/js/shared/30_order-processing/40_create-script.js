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
        ActionFinished;
    //-- EVENTS --
    /**
     * When a unit finishes executing an action.
     * @param {int} time Time for when this happens.
     * @constructor
     */
    ActionFinished = function(time) {
        this.time = time;
    };

    function insertByTime(array, item) {
        var insertionIndex = _.sortedIndex(array, item, 'time');
        array.splice(insertionIndex, 0, item);
    }


    function setOrdersFromPath(unit, ship, path) {
        var prevPos;
        unit.orders = [];
        if (path.length > 1) {
            _.each(path, function(pos) {
                if (prevPos) {
                    unit.orders.push(new sh.orders.Move({
                        unit: unit,
                        ship: ship,
                        from: {x: prevPos[0], y: prevPos[1]},
                        to: {x: pos[0], y: pos[1]}
                    }));
                }
                prevPos = pos;
            });

        }
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
        var script, queue, grid, event, unit, actions, i;
        script = new sh.Script({turnDuration: turnDuration});
        queue = [];
        grid = new sh.PF.Grid(ship.width, ship.height, ship.getPfMatrix());

        function insertInQueue(item) {
            insertByTime(queue, item);
        }

        function registerAction(action) {
            script.actions.push(action);
            insertInQueue(new ActionFinished(action.time +
                action.duration));
            _.each(action.modelChanges, insertInQueue);
        }

        function hasInstantEffect(action) {
            return action.modelChanges[0].time === action.time;
        }

        //Reset what needs to reset every turn
        _.each(ship.units, function(u) {
            u.lastAttack -= turnDuration;
            u.lastGetActionsCall -= turnDuration;
        });

        //set the orders to the units
        _.each(orders, function(order) {
            var unit = ship.getUnitByID(order.unitID),
                dest = order.destination,
                path;
            switch (order.variant) {
            case 'move':
                path = pfFinder.findPath(unit.x, unit.y, dest.x, dest.y,
                    grid.clone());
                setOrdersFromPath(unit, ship, path);
                break;
            }
        });

        //null change to kick-start the process
        queue.push(new sh.ModelChange(0, function() {}));

        //simulation loop (the ship gets modified and actions get added
        // to the script over time)
        while (queue.length > 0 &&
                (!turnOnly || queue[0].time < turnDuration)) {
            event = queue[0];
            queue.shift();
            if (event instanceof sh.ModelChange) {
                //apply changes to the ship
                event.apply(ship);
            }
            //ship.units would be battle.objects in the future
            for (i = 0; i < ship.units.length; i++) {
                unit = ship.units[i];
                if (event.time > unit.lastGetActionsCall) {
                    actions = unit.getActions(event.time, ship);
                    _.each(actions, registerAction);
                    if (_.any(actions, hasInstantEffect)) {
                        break;//stop processing units, the effect should
                             //be applied first ( event.apply(ship) )
                    }
                }
            }

        }

        script.updateActionsByUnit();
        return script;
    }

    //export
    sh.createScript = createScript;
}());
