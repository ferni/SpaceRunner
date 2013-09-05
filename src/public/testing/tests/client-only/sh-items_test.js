/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, asyncTest, test, ok, equal, notEqual, deepEqual, start, th,
me, utils, ui, make, sh, me*/

module('shared/items');
test('engine proper placement', function() {
    'use strict';
    var ship;
    ship = new sh.Ship({tmxName: 'test'});
    ok(ship.buildAt(th.shipPositions.engine.x, th.shipPositions.engine.y,
        'engine'), 'building succeeds');
});

test('engine invalid placement', function() {
    'use strict';
    var ship;
    ship = new sh.Ship({tmxName: 'test'});
    ok(!ship.buildAt(th.shipPositions.free.x, th.shipPositions.free.y,
        'engine'), 'building fails');
});

test('weapon proper placement', function() {
    'use strict';
    var ship;
    ship = new sh.Ship({tmxName: 'test'});
    ok(ship.buildAt(th.shipPositions.weapon.x, th.shipPositions.weapon.y,
        'weapon'), 'building succeeds');
});

test('weapon invalid placement', function() {
    'use strict';
    var ship;
    ship = new sh.Ship({tmxName: 'test'});
    ok(!ship.buildAt(th.shipPositions.free.x, th.shipPositions.free.y,
        'weapon'), 'building fails');
});

test('Console placement', function() {
    'use strict';
    var x, y, ship;
    ship = new sh.Ship({tmxName: 'test'});
    x = th.shipPositions.free.x;
    y = th.shipPositions.free.y;

    ok(!ship.buildAt(x, y, 'console'),
        'Console building fails in the middle of nowhere');
    ok(ship.buildAt(x, y, 'power'), 'Power built');
    ok(ship.buildAt(x - 1, y, 'console'),
        'Console building succeeds next to power');
});


