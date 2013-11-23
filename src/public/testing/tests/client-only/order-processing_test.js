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
        unit = ship.putUnit({speed: 1}),
        moveActions;
    unit.ownerID = 1;
    order = sh.make.moveOrder(unit, {x: unit.x + 2, y: unit.y});
    ok(sh.verifyOrder(order, ship, 1), 'Order is valid');
    script = sh.createScript([order], ship, 3000, true);
    moveActions = script.byType('Move');
    equal(moveActions.length, 2, 'Script has two Move actions');
    equal(moveActions[0].time, 0, 'First action starts at 0');
    equal(moveActions[1].time, 1000, 'Second action starts at 1000');
});

test('script creation\'s ship modifications', function() {
    'use strict';
    var order,
        ship = new sh.Ship({tmxName: 'test'}),
        unit = ship.putUnit({speed: 1}),
        prevX = unit.x;
    unit.ownerID = 1;
    order = sh.make.moveOrder(unit, {x: unit.x + 2, y: unit.y});
    ok(sh.verifyOrder(order, ship, 1), 'Order is valid');
    sh.createScript([order], ship, 5000, true);
    equal(unit.x, prevX + 2, 'The unit position has been modified');
});

test('Script.insertAction', function() {
    'use strict';
    var script = new sh.Script({actions: [
        new sh.actions.Move({
            unitID: 1,
            time: 800,
            duration: 700,
            from: {x: 1, y: 1},
            to: {x: 2, y: 1}
        }),
        new sh.actions.Move({
            unitID: 2,
            time: 200,
            duration: 800,
            from: {x: 1, y: 1},
            to: {x: 2, y: 1}
        }),
        new sh.actions.Attack({
            time: 500,
            duration: 100,
            attackerID: 1,
            receiverID: 2,
            damage: 50
        })
    ], turnDuration: 5000}),
        actionForInsertion = new sh.actions.Attack({
            time: 300,
            duration: 1200,
            attackerID: 2,
            receiverID: 1,
            damage: 70
        });
    script.insertAction(actionForInsertion);
    equal(script.actions[0].unitID, 2);
    equal(script.actions[1], actionForInsertion);
});
