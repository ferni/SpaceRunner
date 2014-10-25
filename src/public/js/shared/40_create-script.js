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
    var maxLoopsAtSameTime = 500;//to prevent endless loops.
    function insertByTime(array, item) {
        var insertionIndex = _.sortedIndex(array, item, 'time');
        array.splice(insertionIndex, 0, item);
    }

    function getVoidModelChange(time) {
        return new sh.ModelChange(0, function() {
            return null;//for jslint
        }, {time: time});
    }

    /**
     * Generates a "script" for the units given all the orders issued.
     * @param {sh.OrderCollection} orderCollection
     * @param {sh.Battle} battle
     * @param {Boolean} resetBattle Should the battle be cleaned up at the end.
     * @return {sh.Script}
     */
    function createScript(orderCollection, battle, resetBattle) {
        var script, queue, changes, time, actors, actor, i,
            registerActionReturned = {}, turnDuration = battle.turnDuration,
            changesAtSameTime = [];
        script = new sh.Script({turnDuration: turnDuration});
        queue = [];
        function insertInQueue(item) {
            insertByTime(queue, item);
        }

        function registerAction(returned, time) {
            return function(action) {
                action.time = time;
                action.updateModelChanges();
                script.actions.push(action);
                _.each(action.modelChanges, function(mc, index) {
                    if (mc.time >= 0) {
                    //Add actionIndex and index used by script.registerChange
                        mc.actionIndex = script.actions.length - 1;
                        mc.index = index;
                        if (mc.time === action.time) {
                            //apply immediate changes
                            mc.apply(battle);
                            script.registerChange(mc);
                            returned.immediateChanges.push(action.toString());
                        } else {
                            insertInQueue(mc);
                        }
                    }
                });
            };
        }

        //set the orders to the units
        battle.insertOrders(orderCollection);

        //null change to kick-start the process
        queue.push(getVoidModelChange(0));

        _.each(battle.pendingActions, function(action) {
            registerAction({}, action.time - turnDuration)(action);
        });

        //simulation loop (the battle gets modified and actions get added
        // to the script over time)
        while (queue.length > 0 && queue[0].time <= turnDuration) {
            time = queue[0].time;
            changes = _.where(queue, {time: time});
            _.invoke(changes, 'apply', battle);
            _.each(changes, script.registerChange, script);
            queue = queue.slice(changes.length);

            if (time < turnDuration) {
                //actions can't start at end of turn
                registerActionReturned.immediateChanges = [];
                actors = battle.getActors();
                for (i = 0; i < actors.length; i++) {
                    actor = actors[i];
                    _.each(actor.getActions(time, battle),
                        registerAction(registerActionReturned, time));
                }
                if (registerActionReturned.immediateChanges.length > 0) {
                    //If any actor returned any action with immediate model
                    //changes, the loop enters again at the same time.
                    changesAtSameTime.push(registerActionReturned.immediateChanges);
                    if (changesAtSameTime.length >= maxLoopsAtSameTime) {
                        throw 'Too much model changes at the same time (' +
                            time + 'ms). Changes stack: ' + changesAtSameTime
                            .slice(changesAtSameTime.length - 11,
                                changesAtSameTime.length - 1).toString() +
                            ' ...';
                    }
                    insertInQueue(getVoidModelChange(time));
                } else {
                    changesAtSameTime = [];
                }
            }
        }

        battle.pendingActions = _.chain(queue)
            .pluck('action')
            .uniq()
            .value();
        script.pendingActionsJson = sh.utils.mapToJson(battle.pendingActions);

        //clean up
        if (resetBattle) {
            battle.endOfTurnReset();
        }
        return script;
    }

    //export
    sh.createScript = createScript;
}());
