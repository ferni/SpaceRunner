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
            return action.time < this.turnDuration && action.time >= 0;
        },
        sort: function() {
            this.actions = _.sortBy(this.actions, 'time');
        },
        /**
         * Inserts an action maintaining their order
         * @param {Action} action The action to be inserted.
         * @return {int} the index of the action.
         */
        insertAction: function(action) {
            var insertionIndex = _.sortedIndex(this.actions, action, 'time');
            //after actions of the same time
            while (this.actions[insertionIndex] &&
                    this.actions[insertionIndex].time === action.time) {
                insertionIndex++;
            }
            this.actions.splice(insertionIndex, 0, action);
            return insertionIndex;
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
        registerChange: function(modelChange) {
            if (modelChange.actionIndex === undefined) {
                return;
            }
            this.sortedModelChangesIndex.push({
                actionIndex: modelChange.actionIndex,
                index: modelChange.index
            });
        },
        /**
         * Returns the model changes in the order in which they
         * were registered by registerChange.
         * @return {Array}
         */
        getSortedModelChanges: function() {
            return _.map(this.sortedModelChangesIndex, function(i) {
                return this.actions[i.actionIndex].modelChanges[i.index];
            }, this);
        }
    });
}());
