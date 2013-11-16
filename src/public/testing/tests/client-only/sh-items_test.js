/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, asyncTest, test, ok, equal, notEqual, deepEqual, start, th,
me, utils, ui, make, sh, me*/

module('shared/items');
test('Engine proper placement', function() {
    'use strict';
    var ship;
    ship = new sh.Ship({tmxName: 'test'});
    ok(ship.buildAt(th.shipPositions.engine.x, th.shipPositions.engine.y,
        'Engine'), 'building succeeds');
});

test('Engine invalid placement', function() {
    'use strict';
    var ship;
    ship = new sh.Ship({tmxName: 'test'});
    ok(!ship.buildAt(th.shipPositions.free.x, th.shipPositions.free.y,
        'Engine'), 'building fails');
});

test('weapon proper placement', function() {
    'use strict';
    var ship;
    ship = new sh.Ship({tmxName: 'test'});
    ok(ship.buildAt(th.shipPositions.weapon.x, th.shipPositions.weapon.y,
        'Weapon'), 'building succeeds');
});

test('weapon invalid placement', function() {
    'use strict';
    var ship;
    ship = new sh.Ship({tmxName: 'test'});
    ok(!ship.buildAt(th.shipPositions.free.x, th.shipPositions.free.y,
        'Weapon'), 'building fails');
});

test('Console placement', function() {
    'use strict';
    var x, y, ship;
    ship = new sh.Ship({tmxName: 'test'});
    x = th.shipPositions.free.x;
    y = th.shipPositions.free.y;

    ok(!ship.buildAt(x, y, 'Console'),
        'Console building fails in the middle of nowhere');
    ok(ship.buildAt(x, y, 'Power'), 'Power built');
    ok(ship.buildAt(x - 1, y, 'Console'),
        'Console building succeeds next to Power');
});


