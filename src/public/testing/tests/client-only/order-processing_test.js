/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, test, ok, equal, sh, deepEqual*/

module('orders');
test('script creation', function() {
    'use strict';
    var order, script,
        ship = new sh.Ship({tmxName: 'test'}),
        unit = ship.putUnit({speed: 1});
    unit.owner = new sh.Player({id: 1, name: 'juan'});
    order = sh.make.moveOrder(unit, {x: unit.x + 2, y: unit.y});
    ok(sh.verifyOrder(order, ship, 1), 'Order is valid');
    script = sh.createScript([order], ship);
    equal(script.actions.length, 2, 'Script has two actions');
    equal(script.actions[0].start, 0, 'First action starts at 0');
    equal(script.actions[1].start, 1000, 'Second action starts at 1000');
});

test('fix actions overlap', function() {
    'use strict';
    var actions = [
        {start: 0, end: 10},
        {start: 7, end: 17},
        {start: 5, end: 15}
    ];

    sh.forTesting.fixActionsOverlap(actions);
    equal(actions[0].start, 0);
    equal(actions[0].end, 10);
    equal(actions[1].start, 10);
    equal(actions[1].end, 20);
    equal(actions[2].start, 20);
    equal(actions[2].end, 30);

});

test('sh.fixEndOfTurnOverlap', function() {
    'use strict';
    var script, ship;
    ship = new sh.Ship({tmxName: 'test'});
    ship.addUnit(new sh.Unit(1, 1, {owner: {id: 1}})); //id 1
    ship.addUnit(new sh.Unit(2, 1, {owner: {id: 1}})); //id 2
    ship.addUnit(new sh.Unit(3, 1, {owner: {id: 1}})); //id 3

    ok(ship.getUnitByID(1));
    ok(ship.getUnitByID(2));
    ok(ship.getUnitByID(3));
    ok(!ship.getUnitByID(123));

    script = new sh.Script({actions: [
        new sh.actions.Move({
            unitID: 1,
            from: {x: 1, y: 1},
            to: {x: 2, y: 1},
            start: 1000,
            end: 2000
        })], turnDuration: 3000});

    sh.forTesting.fixEndOfTurnOverlap(script, ship);
    equal(script.actions[0].start, 3000);
    equal(script.actions[0].end, 4000);

    script = new sh.Script({actions: [
        new sh.actions.Move({
            unitID: 1,
            from: {x: 1, y: 1},
            to: {x: 2, y: 1},
            start: 1000,
            end: 2000
        }),
        new sh.actions.Move({
            unitID: 2,
            from: {x: 2, y: 1},
            to: {x: 1, y: 1},
            start: 1000,
            end: 2000
        })
    ], turnDuration: 3000});

    sh.forTesting.fixEndOfTurnOverlap(script, ship);
    //actions shouldn't change here
    equal(script.actions[0].start, 1000);
    equal(script.actions[0].end, 2000);
    equal(script.actions[1].start, 1000);
    equal(script.actions[1].end, 2000);
    script = new sh.Script({actions: [
        new sh.actions.Move({
            unitID: 1,
            from: {x: 1, y: 1},
            to: {x: 2, y: 2},
            start: 1000,
            end: 2000
        }),
        new sh.actions.Move({
            unitID: 1,
            from: {x: 2, y: 2},
            to: {x: 3, y: 1},
            start: 2000,
            end: 3000
        }),
        new sh.actions.Move({
            unitID: 2,
            from: {x: 2, y: 1},
            to: {x: 2, y: 2},
            start: 1000,
            end: 2000
        })], turnDuration: 3000
        });
    sh.forTesting.fixEndOfTurnOverlap(script, ship);
    ok(script.actions[0].start === 3000 ||
        script.actions[2].start === 3000);

});

test('sh.getStandingPeriods', function() {
    'use strict';
    var script, ship, periods;
    ship = new sh.Ship({tmxName: 'test'});
    ship.addUnit(new sh.Unit(1, 1, {owner: {id: 1}})); //id 1

    ok(ship.getUnitByID(1), 'unit is on the ship');

    script = new sh.Script({actions: [
        new sh.actions.Move({
            unitID: 1,
            from: {x: 1, y: 1},
            to: {x: 2, y: 1},
            start: 1000,
            end: 2000
        }),
        new sh.actions.Move({
            unitID: 1,
            from: {x: 2, y: 1},
            to: {x: 2, y: 2},
            start: 2100,
            end: 2200
        }),
        new sh.actions.Move({
            unitID: 1,
            from: {x: 2, y: 2},
            to: {x: 3, y: 2},
            start: 2200,
            end: 2800
        })], turnDuration: 3000});
    periods = sh.forTesting.getStandingPeriods(script, 1);
    deepEqual(periods, [{start: 0, end: 1000, pos: {x: 1, y: 1}},
        {start: 2000, end: 2100, pos: {x: 2, y: 1}},
        {start: 2800, end: 3000, pos: {x: 3, y: 2}}],
        'The standing time periods array is as expected');
});

test('sh.getPositions', function() {
    'use strict';
    var script, ship, positions, unit;
    ship = new sh.Ship({tmxName: 'test'});
    ship.addUnit(new sh.Unit(1, 1, {owner: {id: 1}})); //id 1
    unit = ship.getUnitByID(1);
    ok(unit, 'unit is on the ship');

    script = new sh.Script({actions: [
        new sh.actions.Move({
            unitID: 1,
            from: {x: 1, y: 1},
            to: {x: 2, y: 1},
            start: 1000,
            end: 2000
        }),
        new sh.actions.Move({
            unitID: 1,
            from: {x: 2, y: 1},
            to: {x: 2, y: 2},
            start: 2100,
            end: 2200
        }),
        new sh.actions.Move({
            unitID: 1,
            from: {x: 2, y: 2},
            to: {x: 3, y: 2},
            start: 2200,
            end: 2800
        })], turnDuration: 3000});
    positions = sh.forTesting.getPositionsForUnit(script, unit);
    deepEqual(positions, [
        {pos: {x: 1, y: 1}, time: 0},
        {pos: {x: 2, y: 1}, time: 2000},
        {pos: {x: 2, y: 2}, time: 2200},
        {pos: {x: 3, y: 2}, time: 2800}
    ],
        'The positions info array is as expected');
});

test('sh.getOverlaps', function() {
    'use strict';
    var script, ship, positions, unitsPositions, overlaps, u1, u2, u3;
    ship = new sh.Ship({tmxName: 'test'});
    ship.addUnit(new sh.Unit(1, 1, {owner: {id: 1}})); //id 1
    ship.addUnit(new sh.Unit(1, 1, {owner: {id: 1}})); //id 2
    ship.addUnit(new sh.Unit(2, 1, {owner: {id: 1}})); //id 3
    u1 = ship.getUnitByID(1);
    u2 = ship.getUnitByID(2);
    u3 = ship.getUnitByID(3);
    ok(u1, 'unit 1 on ship');
    ok(u2, 'unit 2 on ship');
    ok(u3, 'unit 3 on ship');

    //unit 1 will be standing at (1, 1), units 2 and 3 will cross it.
    script = new sh.Script({actions: [
        new sh.actions.Move({
            unitID: 2,
            from: {x: 1, y: 1},
            to: {x: 2, y: 1},
            start: 1000,
            end: 2000
        }),
        new sh.actions.Move({
            unitID: 2,
            from: {x: 2, y: 1},
            to: {x: 1, y: 1},
            start: 2100,
            end: 2200
        }),
        new sh.actions.Move({
            unitID: 3,
            from: {x: 2, y: 1},
            to: {x: 1, y: 1},
            start: 2200,
            end: 2800
        }),
        new sh.actions.Move({
            unitID: 3,
            from: {x: 1, y: 1},
            to: {x: 2, y: 1},
            start: 2800,
            end: 4000
        })], turnDuration: 3000});
    positions = sh.forTesting.getPositionsForUnit(script, u2);
    deepEqual(positions, [
        {pos: {x: 1, y: 1}, time: 0},
        {pos: {x: 2, y: 1}, time: 2000},
        {pos: {x: 1, y: 1}, time: 2200}
    ],
        'The positions info array for unit 2 is as expected');
    positions = sh.forTesting.getPositionsForUnit(script, u3);
    deepEqual(positions, [
        {pos: {x: 2, y: 1}, time: 0},
        {pos: {x: 1, y: 1}, time: 2800},
        {pos: {x: 2, y: 1}, time: 4000}
    ],
        'The positions info array for unit 3 is as expected');

    unitsPositions = sh.forTesting.getUnitsPositions(script, ship);
    overlaps = sh.forTesting.getOverlaps(script, unitsPositions, {x: 1, y: 1},
        {start: 0, end: 3000}, 1);
    deepEqual(overlaps, [
        {unitID: 2, start: 0, end: 2000},
        {unitID: 2, start: 2200, end: 3000},
        {unitID: 3, start: 2800, end: 3000}
    ],
        'Get overlaps, with period encompassing the entire turn, correct.');
    //TODO: try other periods
});
