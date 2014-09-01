/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global test, sh, module*/

module('sh-battle');
test('getUnits', function() {
    var battle = new sh.Battle({}),
        ship1 = new sh.Ship({tmxName: 'test'}),
        ship2 = new sh.Ship({tmxName: 'test'}),
        units;
    ship1.battle = battle;
    ship2.battle = battle;
    ship1.putUnit({});
    ship1.putUnit({});
    ship2.putUnit({});
    battle.ships = [ship1, ship2];
    units = battle.getUnits();
    equal(units.length, 3, 'Should be 3 units');
});
