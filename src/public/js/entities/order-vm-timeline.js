/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global _, gs, me, utils, sh, ko*/

var OrderVMTimeline =  Object.extend({
    isPreview: false,
    init: function(order, timeline, battle) {
        'use strict';
        this.m = order;
        this.timeInfo = ko.observable({});//start, end
        this.isBeyondNextTurn = ko.computed(function() {
            return this.timeInfo().start === undefined;
        }, this);
        this.itemHeight = ko.computed(function() {
            var duration = this.timeInfo().end - this.timeInfo().start,
                height;
            if (duration) {
                height = duration / 10 * timeline.zoomLevel();
                height -= 6; //accounting for padding
                height -= 2; //accounting for border
                height -= 2; //some space for next order
                return height + 'px';
            }
        }, this);
        this.willCompleteThisTurn = ko.computed(function() {
            return this.timeInfo().end <= battle.turnDuration;
        }, this);
        this.itemColorObs = ko.computed(function() {
            return this.willCompleteThisTurn() ? this.itemColor : 'dimgray';
        }, this);
        this.remove = function() {
            console.warn('OrderVM remove not implemented');
        };
    }
});
