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
     * @param {sh.Unit} unit
     * @constructor
     */
    ActionFinished = function(time, unit) {
        this.time = time;
        this.unit = unit;
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
        var script, queue, grid, event, unit, action, pendingUnits,
            i;
        script = new sh.Script({turnDuration: turnDuration});
        queue = [];
        grid = new sh.PF.Grid(ship.width, ship.height, ship.getPfMatrix());
        pendingUnits = [];

        function insertInQueue(item) {
            insertByTime(queue, item);
        }

        function registerAction(unit, action) {
            unit.orders.shift();
            insertInQueue(new ActionFinished(action.time +
                action.duration, unit));
            script.actions.push(action);
            _.each(action.modelChanges, insertInQueue);
        }

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
                if (unit.orders.length > 0) {
                    pendingUnits.push(unit);
                }
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
                for (i = 0; i < pendingUnits.length; i++) {
                    unit = pendingUnits[i];
                    action = unit.orders[0].execute(event.time);

                    if (action) {//action started executing
                        pendingUnits.splice(_.indexOf(pendingUnits, unit), 1);
                        i--;
                        registerAction(unit, action);
                        if (action.modelChanges[0].time ===
                                action.time) { //has an instantaneous effect
                            break;//stop processing units, the effect should
                                  //be applied first ( event.apply(ship) )
                        }
                    }
                }
            } else if (event instanceof ActionFinished) {
                //execute next action for unit
                if (event.unit.orders.length > 0) {
                    action = event.unit.orders[0].execute(event.time);
                    if (action) {
                        registerAction(event.unit, action);
                    } else {
                        pendingUnits.push(event.unit);
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
