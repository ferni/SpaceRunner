/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, asyncTest, test, ok, equal, notEqual, deepEqual, start, th,
me, utils*/

module('test_helpers.js');
asyncTest('onLevelReady', function() {
    'use strict';
    th.onLevelReady(function() {
        ok(me.state.isCurrent(me.state.BUILD), 'Level is indeed ready');
        start();
    });
});

asyncTest('setMouse', function() {
    'use strict';
    th.onLevelReady(function() {
        th.mouseBegin();
        th.setMouse(4, 6);
        equal(utils.getMouse().x, 4, 'x');
        equal(utils.getMouse().y, 6, 'y');
        th.mouseEnd();
        start();
    });
});

