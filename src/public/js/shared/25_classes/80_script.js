/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, require, module, exports*/

var sh = require('../25_classes/70_orders'), _ = sh._;
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
        sortedModelChangesIndex: [],
        init: function(parameters) {
            if (parameters) {
                this.actions = parameters.actions;
                this.turnDuration = parameters.turnDuration;
                this.sort();
            }
            this.sortedModelChangesIndex = [];
        },
        fromJson: function(json) {
            //logic here
            this.turnDuration = json.turnDuration;
            this.actions = _.map(json.actions, function(actionJson) {
                return new sh.actions[actionJson.type](actionJson);
            });
            this.sortedModelChangesIndex = json.sortedModelChangesIndex;
            this.updateActionsByUnit();
            return this;
        },
        toJson: function() {
            return {
                turnDuration: this.turnDuration,
                actions: _.map(this.actions, function(action) {
                    return action.toJson();
                }),
                sortedModelChangesIndex: this.sortedModelChangesIndex
            };
        },
        isWithinTurn: function(action) {
            return action.time < this.turnDuration;
        },
        sort: function() {
            this.actions = _.sortBy(this.actions, 'time');
            this.updateActionsByUnit();
        },
        /**
         * Inserts an action maintaining their order
         * @param {Action} action The action to be inserted.
         * @return {int} the index of the action.
         */
        insertAction: function(action) {
            var insertionIndex = _.sortedIndex(this.actions, action, 'time');
            this.actions.splice(insertionIndex, 0, action);
            return insertionIndex;
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
        indexChange: function(modelChange) {
            if (modelChange.actionIndex === undefined) {
                return;
            }
            this.sortedModelChangesIndex.push({
                actionIndex: modelChange.actionIndex,
                index: modelChange.index
            });
        },
        getSortedModelChanges: function() {
            return _.map(this.sortedModelChangesIndex, function(i) {
                return this.actions[i.actionIndex].modelChanges[i.index];
            }, this);
        }
    });
}());
