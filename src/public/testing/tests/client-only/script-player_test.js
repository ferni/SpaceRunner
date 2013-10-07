/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global test, ScriptPlayer, deepEqual*/

test('getPerpendicularDistanceToLane', function() {
    'use strict';
    var sp = new ScriptPlayer(),
        getD = sp.getPerpendicularDistanceToLane;
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

    deepEqual(getD(v(3, 3), l([1, 1], [2, 2])), v(0, 0));
    deepEqual(getD(v(10, 3), l([1, 1], [2, 2])), v(-3.5, 3.5));
    deepEqual(getD(v(1, 1), l([-1, 1], [0, 2])), v(0, 0));
    deepEqual(getD(v(-1, 3), l([-1, 1], [0, 2])), v(0, 0));
    deepEqual(getD(v(4, 10), l([0, 1], [4, 6])), v(0, 0));
    deepEqual(getD(v(7, 10), l([0, 1], [4, 6])), v(-3, 0));
    deepEqual(getD(v(-4, -10), l([0, 1], [4, 6])), v(8, 0));
    deepEqual(getD(v(7, 9), l([1, 0], [7, 9])), v(0, 0));
    deepEqual(getD(v(11, 9), l([1, 0], [7, 9])), v(0, 0));
    deepEqual(getD(v(11, 12), l([1, 0], [7, 9])), v(0, -3));
});
