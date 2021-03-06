/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, asyncTest, test, ok, equal, notEqual, deepEqual, start, th,
me, utils, ui, make, sh, me, itemVMs*/

module('entities/tile-entity-vm.js');
test('Item.trueSize()', function() {
    'use strict';
    var door = new itemVMs.Door(new sh.items.Door()),
        s = th.s;
    deepEqual(door.size, [s(2), s(1)]);
    deepEqual(door.trueSize(), [s(2), s(1)]);

    door.rotated(true);
    deepEqual(door.trueSize(), [s(1), s(2)]);
    equal(door.trueSize(0), s(1));
    equal(door.trueSize(1), s(2));
});

test('Item onShip/offShip animations', function() {
    'use strict';
    var door = new itemVMs.Door(new sh.items.Door());
    ok(!door.onShip(), 'door is not on ship');
    ok(!door.rotated(), 'door is not rotated');

    door.onShip(new sh.Ship({tmxName: 'test'})); //not really ;)
    ok(door.isCurrentAnimation('h_open_close'),
        "on ship it has 'h_open_close' animation");

    door.rotated(true);
    door.onShip(false);
    ok(door.isCurrentAnimation('v_idle'));

});

