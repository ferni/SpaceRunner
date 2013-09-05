/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, asyncTest, test, ok, equal, notEqual, deepEqual, start, th,
me, utils, ui, make, sh, me*/

module('entities/tile-entity-vm.js');
test('Item.trueSize()', function() {
    'use strict';
    var door = make.item('door');
    deepEqual(door.size, [2, 1]);
    deepEqual(door.trueSize(), [2, 1]);

    door.rotated(true);
    deepEqual(door.trueSize(), [1, 2]);
    equal(door.trueSize(0), 1);
    equal(door.trueSize(1), 2);
});

test('Item onShip/offShip animations', function() {
    'use strict';
    var door = make.item('door');
    ok(!door.onShip(), 'door is not on ship');
    ok(!door.rotated(), 'door is not rotated');

    door.onShip(new sh.Ship({tmxName: 'test'})); //not really ;)
    ok(door.isCurrentAnimation('h_open_close'),
        "on ship it has 'h_open_close' animation");

    door.rotated(true);
    door.onShip(false);
    ok(door.isCurrentAnimation('v_idle'));

});

