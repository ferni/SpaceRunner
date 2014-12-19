/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, me, $*/
/**
 * Executes a callback when a certain number of
 * .done() were called on TaskWait, or an
 * error handler if .error() was called instead.
 * @param {Object} settings has 'pendingCount'(int), 'allDone', 'error'.
 * @constructor
 */
var TaskWait = function(settings) {
    'use strict';
    var tickCount = 0,
        errorThrown = false,
        pendingCount = settings.pendingCount,
        _allDoneCallback = settings.allDone,
        _errorCallback = settings.error;

    this.done = function() {
        if (errorThrown) {
            return;
        }
        tickCount++;
        if (tickCount === pendingCount) {
            _allDoneCallback();
        } else if (tickCount > pendingCount) {
            throw 'Number of ticks exceeded expected count ' +
                '(pendingCount).';
        }
    };
    this.error = function() {
        errorThrown = true;
        _errorCallback();
    };
};

var screens = module.exports = {
    all: [],
    register: function(screenName, Constructor) {
        'use strict';
        me.state[screenName] = screenName;
        me.state.set(screenName, new Constructor(screenName));
        screens.all.push(screenName);
    },
    loadHtmls: function(callback) {
        'use strict';
        var i, tasks = new TaskWait({
            pendingCount: screens.all.length,
            allDone: callback,
            error: function() {
                alert('An error has occurred attempting to load html ' +
                    'templates.');
            }
        });
        for (i = 0; i < screens.all.length; i++) {
            this.storeHtml(screens.all[i], tasks.done, tasks.error);
        }
    },
    storedHtmls: {},
    storeHtml: function(screenId, success, error) {
        'use strict';
        var self = this;
        $.get('/screens-html/' + screenId + '.html', function(data) {
            self.storedHtmls[screenId] = data;
            if (success) {
                success();
            }
        }).fail(function() {
            if (error) {
                error();
            }
        });
    }

};
