/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module, me*/

var _ = require('underscore')._;

module.exports = function(frames) {
    'use strict';
    var bindings = [];

    function notifyFrames(key) {
        _.invoke(frames, 'keyPressed', key);
    }

    function keyPressHandler(key) {
        _.chain(bindings)
            .where({key: key})
            .invoke('handler');
        notifyFrames(key);
    }
    _.each(frames, function(frame) {
        frame.eventHandlers.push(function(e) {
            if (e.type === 'key pressed') {
                keyPressHandler(e.key);
            }
        });
    });

    return {
        bind: function(key, handler) {
            me.input.bindKey(key, key, true);
            bindings.push({key: key, handler: handler});
        },
        unbindAll: function() {
            _.each(bindings, function(b) {
                me.input.unbindKey(b.key);
            });
        },
        processBindings: function() {
            _.each(bindings, function(b) {
                if (me.input.isKeyPressed(b.key)) {
                    b.handler();
                    notifyFrames(b.key);
                }
            });
        }
    };
};
