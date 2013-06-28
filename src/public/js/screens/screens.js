
 /*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, html, utils*/

var screens = {
    all: [],
    register: function(screenName, Constructor) {
        'use strict';
        me.state[screenName] = screenName;
        me.state.set(screenName, new Constructor(screenName));
        screens.all.push(screenName);
    },
    loadAll: function(callback) {
        'use strict';
        var i, tasks = new utils.TaskWait({
            pendingCount: screens.all.length,
            allDone: callback,
            error: function(){
                alert('An error has occurred attempting to load html ' +
                    'templates.');
            }
        });
        for (i = 0; i < screens.all.length; i++) {
            html.store(screens.all[i] + '-screen', tasks.done, tasks.error);
        }
    }
};
