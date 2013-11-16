/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global test, sh, deepEqual, ok*/


test('sh.Ship.compareJson', function() {
    'use strict';
    var ship = new sh.Ship({tmxName: 'test'}),
        shipClone;
    ship.addUnit(new sh.units.Critter({x: 3, y: 4}));
    ship.addUnit(new sh.units.Zealot({x: 1, y: 2}));
    ship.addUnit(new sh.Unit({x: 7, y: 8}));
    ship.buildAt(3, 4, 'Wall');
    ship.buildAt(4, 4, 'Wall');
    shipClone = ship.clone();
    deepEqual(ship.toJson(), shipClone.toJson(),
        'ship.toJson equal to ship\'s clone toJson');
    ok(ship.compareJson(shipClone.toJson()), 'compareJson says they\'re equal');
});
