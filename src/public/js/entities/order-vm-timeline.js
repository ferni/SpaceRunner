/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global _, gs, me, utils, sh, ko*/

var OrderVM =  Object.extend({
    isPreview: false,
    init: function(order) {
        'use strict';
        //Timeline item stuff
        this.timeInfo = ko.observable({});//start, end
        this.isBeyondNextTurn = ko.computed(function() {
            return this.timeInfo().start === undefined;
        }, this);
        this.itemHeight = ko.computed(function() {
            var duration = this.timeInfo().end - this.timeInfo().start,
                height;
            if (duration) {
                height = duration / 10 * this.screen.timeline.zoomLevel();
                height -= 6; //accounting for padding
                height -= 2; //accounting for border
                height -= 2; //some space for next order
                return height + 'px';
            }
        }, this);
        this.willCompleteThisTurn = ko.computed(function() {
            return this.timeInfo().end <= this.screen.turnDuration;
        }, this);
        this.itemColorObs = ko.computed(function() {
            return this.willCompleteThisTurn() ? this.itemColor : 'dimgray';
        }, this);
    }
});
