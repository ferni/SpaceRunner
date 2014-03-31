/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module, exports*/

var sh = require('./25_classes/80_script'), _ = sh._;
if (typeof exports !== 'undefined') {
    /**
     * NodeJS exports
     * @type {*}
     */
    sh = module.exports = sh;
}

(function() {
    'use strict';

    function insertByTime(array, item) {
        var insertionIndex = _.sortedIndex(array, item, 'time');
        array.splice(insertionIndex, 0, item);
    }

    /**
     * Generates a "script" for the units given all the orders issued.
     * @param {Array} orders
     * @param {sh.Ship} ship
     * @param {int} turnDuration
     * @param {Boolean} resetShip Should the ship be cleaned up at the end.
     * @return {sh.Script}
     */
    function createScript(orders, ship, turnDuration, resetShip) {
        var script, queue, changes, time, unit, i;
        script = new sh.Script({turnDuration: turnDuration});
        queue = [];
        function insertInQueue(item) {
            insertByTime(queue, item);
        }

        function registerAction(action) {
            script.actions.push(action);
            _.each(action.modelChanges, function(mc, index) {
                insertInQueue(mc);
                //Add actionIndex and index for adding sorted modelChanges
                //to the script in the order in which they are applied.
                mc.actionIndex = script.actions.length - 1;
                mc.index = index;
            });
        }

        //set the orders to the units
        ship.insertOrders(orders);

        //null change to kick-start the process
        queue.push(new sh.ModelChange(0, function() {}, {time: 0}));

        //simulation loop (the ship gets modified and actions get added
        // to the script over time)
        while (queue.length > 0 && queue[0].time < turnDuration) {
            time = queue[0].time;
            changes = _.where(queue, {time: time});
            _.invoke(changes, 'apply', ship);
            _.each(changes, script.indexChange, script);
            queue = queue.slice(changes.length);

            //ship.units would be battle.objects in the future
            for (i = 0; i < ship.units.length; i++) {
                unit = ship.units[i];
                _.each(unit.getActions(time, ship), registerAction);
            }
        }

        //make remaining changes
        _.invoke(queue, 'apply', ship);
        _.each(queue, script.indexChange, script);

        //clean up
        if (resetShip) {
            ship.endOfTurnReset();
        }
        script.updateActionsByUnit();
        return script;
    }

    //export
    sh.createScript = createScript;
}());
