/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global test, ScriptPlayer, ok*/

test('isInLane', function() {
    'use strict';
    var sp = new ScriptPlayer();
    function v(x, y) {
        return {x: x, y: y};
    }
    //lane maker
    function l(direction, entryPoint) {
        return {
            direction: {x: direction[0], y: direction[1]},
            entryPoint: {x: entryPoint[0], y: entryPoint[1]}
        };
    }

    ok(sp.isInLane(v(3, 3), l([1, 1], [2, 2])));
    ok(!sp.isInLane(v(3, 4), l([1, 1], [2, 2])));
    ok(sp.isInLane(v(1, 1), l([-1, 1], [0, 2])));
    ok(!sp.isInLane(v(1, 2), l([-1, 1], [0, 2])));
    ok(sp.isInLane(v(-1, 3), l([-1, 1], [0, 2])));
    ok(sp.isInLane(v(4, 10), l([0, 1], [4, 6])));
    ok(sp.isInLane(v(4, -10), l([0, 1], [4, 6])));
    ok(!sp.isInLane(v(5, -10), l([0, 1], [4, 6])));
    ok(sp.isInLane(v(7, 9), l([1, 0], [7, 9])));

});
