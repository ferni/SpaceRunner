/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, require, module, exports*/

var sh = require('../30_order-processing/10_actions'), _ = sh._;
if (typeof exports !== 'undefined') {
    /**
     * NodeJS exports
     * @type {*}
     */
    sh = module.exports = sh;
}

(function() {
    'use strict';
    /**
     * A collection of Actions.
     * @type {*}
     */
    sh.Script = sh.SharedClass.extendShared({
        turnDuration: 0,
        actions: [],
        byUnit: {},
        init: function(parameters) {
            if (parameters) {
                this.actions = parameters.actions;
                this.turnDuration = parameters.turnDuration;
                this.sort();
            }
        },
        fromJson: function(json) {
            //logic here
            this.turnDuration = json.turnDuration;
            this.actions = _.map(json.actions, function(actionJson) {
                return new sh.actions[actionJson.type](actionJson);
            });
            this.updateActionsByUnit();
            return this;
        },
        toJson: function() {
            return {
                turnDuration: this.turnDuration,
                actions: _.map(this.actions, function(action) {
                    return action.toJson();
                })
            };
        },
        isWithinTurn: function(action) {
            if (action instanceof sh.actions.Move) {
                return action.time + action.duration <= this.turnDuration;
            }
            return action.time < this.turnDuration;
        },
        sort: function() {
            this.actions = _.sortBy(this.actions, 'time');
            this.updateActionsByUnit();
        },
        /**
         * Inserts an action maintaining their order
         * @param {Action} action The action to be inserted.
         */
        insertAction: function(action) {
            var insertionIndex = _.sortedIndex(this.actions, action, 'time');
            this.actions.splice(insertionIndex, 0, action);
        },
        getLastMoveAction: function(unit) {
            var moveActions = _.filter(this.byUnit[unit.id], function(a) {
                return a instanceof sh.actions.Move &&
                    this.isWithinTurn(a);
            }, this);
            if (moveActions && moveActions.length > 0) {
                return moveActions[moveActions.length - 1];
            }
            return null;
        },
        /**
         * Filter the actions by type (String).
         * @param {String} type
         */
        byType: function(type) {
            return _.filter(this.actions, function(a) {
                return a.type === type;
            });
        },
        updateActionsByUnit: function() {
            var actionsByUnit = {};
            _.each(this.actions, function(action) {
                if (action.unitID !== undefined) {
                    if (!actionsByUnit[action.unitID]) {
                        actionsByUnit[action.unitID] = [];
                    }
                    actionsByUnit[action.unitID].push(action);
                }
            });
            this.byUnit = actionsByUnit;
        },
        getSortedModelChanges: function() {
            var changes = [];
            _.each(this.actions, function(a) {
                changes = changes.concat(a.modelChanges);
            });
            return _.sortBy(changes, 'time');
        }
    });
}());
