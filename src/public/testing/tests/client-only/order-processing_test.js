/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, test, ok, equal, sh, deepEqual, _*/

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

test('Script.insertAction', function() {
    'use strict';
    var script = new sh.Script({actions: [
        new sh.actions.Move({
            unitID: 1,
            start: 800,
            end: 1500,
            from: {x: 1, y: 1},
            to: {x: 2, y: 1}
        }),
        new sh.actions.Move({
            unitID: 2,
            start: 200,
            end: 1000,
            from: {x: 1, y: 1},
            to: {x: 2, y: 1}
        }),
        new sh.actions.Attack({
            start: 500,
            end: 600,
            attackerID: 1,
            receiverID: 2,
            damage: 50
        })
    ], turnDuration: 5000}),
        actionForInsertion = new sh.actions.Attack({
            start: 300,
            end: 1500,
            attackerID: 2,
            receiverID: 1,
            damage: 70
        });
    script.insertAction(actionForInsertion);
    equal(script.actions[0].unitID, 2);
    equal(script.actions[1], actionForInsertion);
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

test('fixEndOfTurnOverlap', function() {
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

test('getStandingPeriods', function() {
    'use strict';
    var script, ship, periods, unit;
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
    periods = sh.forTesting.getStandingPeriods(script, unit);
    deepEqual(periods, [{start: 0, end: 1000, pos: {x: 1, y: 1}},
        {start: 2000, end: 2100, pos: {x: 2, y: 1}},
        {start: 2800, end: 3000, pos: {x: 3, y: 2}}],
        'The standing time periods array is as expected');
});

test('getPositionPeriodsForUnit', function() {
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
    positions = sh.forTesting.getPositionPeriodsForUnit(script, unit);
    deepEqual(positions, [
        {pos: {x: 1, y: 1}, start: 0, end: 2000},
        {pos: {x: 2, y: 1}, start: 2000, end: 2200},
        {pos: {x: 2, y: 2}, start: 2200, end: 2800},
        {pos: {x: 3, y: 2}, start: 2800, end: 3000}
    ],
        'The positions info array is as expected');
});

test('getOverlaps', function() {
    'use strict';
    var script, ship, positions, unitsPositions, overlaps, u1, u2, u3;
    ship = new sh.Ship({tmxName: 'test'});
    ship.addUnit(new sh.Unit(1, 1, {owner: {id: 1}})); //id 1
    ship.addUnit(new sh.Unit(1, 1, {owner: {id: 2}})); //id 2
    ship.addUnit(new sh.Unit(2, 1, {owner: {id: 2}})); //id 3
    u1 = ship.getUnitByID(1);
    u2 = ship.getUnitByID(2);
    u3 = ship.getUnitByID(3);
    ok(u1, 'unit 1 on ship');
    ok(u2, 'unit 2 on ship');
    ok(u3, 'unit 3 on ship');

    //unit 1 will be standing at (1, 1), units 2 and 3 will cross it.
    script = new sh.Script({actions: [
        new sh.actions.Move({
            unitID: 3,
            from: {x: 2, y: 1},
            to: {x: 1, y: 1},
            start: 1500,
            end: 1800
        }),
        new sh.actions.Move({
            unitID: 3,
            from: {x: 1, y: 1},
            to: {x: 2, y: 1},
            start: 2800,
            end: 4000
        }),
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
        })], turnDuration: 3000});
    positions = sh.forTesting.getPositionPeriodsForUnit(script, u2);
    deepEqual(positions, [
        {pos: {x: 1, y: 1}, start: 0, end: 2000},
        {pos: {x: 2, y: 1}, start: 2000, end: 2200},
        {pos: {x: 1, y: 1}, start: 2200, end: 3000}
    ], 'The positions info array for unit 2 is as expected');

    positions = sh.forTesting.getPositionPeriodsForUnit(script, u3);
    deepEqual(positions, [
        {pos: {x: 2, y: 1}, start: 0, end: 1800},
        {pos: {x: 1, y: 1}, start: 1800, end: 3000}
    ], 'The positions info array for unit 3 is as expected');

    unitsPositions = sh.forTesting.getUnitsPositions(script, ship);
    overlaps = sh.forTesting.getOverlaps(u1, unitsPositions, {x: 1, y: 1},
        {start: 0, end: 3000});
    deepEqual(overlaps, [
        {unitID: 2, start: 0, end: 2000},
        {unitID: 2, start: 2200, end: 3000},
        {unitID: 3, start: 1800, end: 3000}
    ], 'Get overlaps, with period encompassing the entire turn, correct.');

    overlaps = sh.forTesting.getOverlaps(u1, unitsPositions, {x: 1, y: 1},
        {start: 1000, end: 2000});
    deepEqual(overlaps, [
        {unitID: 2, start: 1000, end: 2000},
        {unitID: 3, start: 1800, end: 2000}
    ], 'Get overlaps, with period 1000-2000, correct.');
});

test('addAttackActions', function() {
    'use strict';
    var script, ship, u1, u2, u3, attacks, u1Attack, u2Attack, u3Attack;
    ship = new sh.Ship({tmxName: 'test'});
    ship.addUnit(new sh.Unit(2, 2, {owner: {id: 1}})); //id 1
    ship.addUnit(new sh.Unit(2, 2, {owner: {id: 2}})); //id 2
    ship.addUnit(new sh.Unit(1, 1, {owner: {id: 2}})); //id 3
    ship.addUnit(new sh.Unit(4, 7, {owner: {id: 1}})); //id 4 (won't move)
    u1 = ship.getUnitByID(1);
    u2 = ship.getUnitByID(2);
    u3 = ship.getUnitByID(3);
    ok(u1, 'unit 1 on ship');
    ok(u2, 'unit 2 on ship');
    ok(u3, 'unit 3 on ship');
    //attack cooldown for the units is 500 ms (default)
    script = new sh.Script({actions: [
        new sh.actions.Move({
            unitID: 2,
            from: {x: 2, y: 2},
            to: {x: 1, y: 1},
            start: 200,     //u1 attacks, u2 attacks (they share the 2,2 tile)
            end: 750        //u1 attacks again (u2 doesn't because it's moving)
        }),
        new sh.actions.Move({
            unitID: 3,
            from: {x: 1, y: 1},
            to: {x: 2, y: 2},
            start: 1000,
            end: 1200 //u1 attacks at 1200, u3 also
        }),
        new sh.actions.Move({
            unitID: 1,
            from: {x: 2, y: 2},
            to: {x: 1, y: 1},
            start: 1250,
            end: 1300       //u2 attacks at 1300 and 1800, u1 at 1700
        })], turnDuration: 2000});
    sh.forTesting.addAttackActions(script, ship);
    attacks = _.filter(script.actions, function(action) {
        return action instanceof sh.actions.Attack;
    });
    equal(attacks.length, 8);
    u1Attack = attacks[0].attackerID === 1 ? attacks[0] : attacks[1];
    u2Attack = attacks[0].attackerID === 2 ? attacks[0] : attacks[1];
    equal(u1Attack.start, 0);
    equal(u1Attack.attackerID, 1);
    equal(u1Attack.receiverID, 2);
    equal(u2Attack.start, 0);
    equal(u2Attack.attackerID, 2);
    equal(u2Attack.receiverID, 1);
    equal(attacks[2].start, 500);
    equal(attacks[2].attackerID, 1);
    equal(attacks[2].receiverID, 2);

    u1Attack = attacks[3].attackerID === 1 ? attacks[3] : attacks[4];
    u3Attack = attacks[3].attackerID === 3 ? attacks[3] : attacks[4];
    equal(u1Attack.start, 1200);
    equal(u1Attack.attackerID, 1);
    equal(u1Attack.receiverID, 3);
    equal(u3Attack.start, 1200);
    equal(u3Attack.attackerID, 3);
    equal(u3Attack.receiverID, 1);
    equal(attacks[5].start, 1300);
    equal(attacks[5].attackerID, 2);
    equal(attacks[5].receiverID, 1);
    equal(attacks[6].start, 1700);
    equal(attacks[6].attackerID, 1);
    equal(attacks[6].receiverID, 2);
    equal(attacks[7].start, 1800);
    equal(attacks[7].attackerID, 2);
    equal(attacks[7].receiverID, 1);
});

test('addAttackActions: units standing still', function() {
    'use strict';
    var script, ship, u1, u2, attacks, u1Attack, u2Attack;
    ship = new sh.Ship({tmxName: 'test'});
    ship.addUnit(new sh.Unit(2, 2, {owner: {id: 1}})); //id 1
    ship.addUnit(new sh.Unit(2, 2, {owner: {id: 2}})); //id 2
    u1 = ship.getUnitByID(1);
    u2 = ship.getUnitByID(2);
    ok(u1, 'unit 1 on ship');
    ok(u2, 'unit 2 on ship');
    //attack cooldown for the units is 500 ms (default)
    script = new sh.Script({actions: [], turnDuration: 2000});
    sh.forTesting.addAttackActions(script, ship);
    attacks = _.filter(script.actions, function(action) {
        return action instanceof sh.actions.Attack;
    });
    equal(attacks.length, 8);
    u1Attack = attacks[0].attackerID === 1 ? attacks[0] : attacks[1];
    u2Attack = attacks[0].attackerID === 2 ? attacks[0] : attacks[1];
    equal(u1Attack.start, 0);
    equal(u1Attack.attackerID, 1);
    equal(u1Attack.receiverID, 2);
    equal(u2Attack.start, 0);
    equal(u2Attack.attackerID, 2);
    equal(u2Attack.receiverID, 1);
    u1Attack = attacks[2].attackerID === 1 ? attacks[2] : attacks[3];
    u2Attack = attacks[2].attackerID === 2 ? attacks[2] : attacks[3];
    equal(u1Attack.start, 500);
    equal(u1Attack.attackerID, 1);
    equal(u1Attack.receiverID, 2);
    equal(u2Attack.start, 500);
    equal(u2Attack.attackerID, 2);
    equal(u2Attack.receiverID, 1);

});

