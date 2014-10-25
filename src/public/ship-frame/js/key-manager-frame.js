/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, _*/

var KeyManagerFrame = function() {
    'use strict';
    var bindings = [];

    function keyPressHandler(key) {
        _.chain(bindings)
            .where({key: key})
            .invoke('handler');
    }

    window.addEventListener('message', function(event) {
        if (event.data.type === 'key pressed') {
            keyPressHandler(event.data.key);
        }
    }, false);

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
                    parent.postMessage({type: 'key pressed', key: b.key}, '*');
                }
            });
        }
    };
};
