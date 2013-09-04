/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, test, ok, equal, sh*/

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
    equal(script.length, 2, 'Script has two actions');
    equal(script[0].start, 0, 'First action starts at 0');
    equal(script[1].start, 1000, 'Second action starts at 1000');
});

test('fix actions overlap', function() {
    'use strict';
    var actions = [
        {start: 0, end: 10},
        {start: 7, end: 17},
        {start: 5, end: 15}
    ];

    sh.fixActionsOverlap(actions);
    equal(actions[0].start, 0);
    equal(actions[0].end, 10);
    equal(actions[1].start, 10);
    equal(actions[1].end, 20);
    equal(actions[2].start, 20);
    equal(actions[2].end, 30);

});

test('sh.fixEndOfTurnOverlap', function() {
    'use strict';
    var actions, ship;
    ship = new sh.Ship({tmxName: 'test'});
    ship.addUnit(new sh.Unit(1, 1)); //id 1
    ship.addUnit(new sh.Unit(2, 1)); //id 2
    ship.addUnit(new sh.Unit(3, 1)); //id 3

    ok(ship.getUnitByID(1));
    ok(ship.getUnitByID(2));
    ok(ship.getUnitByID(3));
    ok(!ship.getUnitByID(123));

    actions = [{
        type: 'Action',
        variant: 'move',
        unitID: 1,
        from: {x: 1, y: 1},
        to: {x: 2, y: 1},
        start: 1000,
        end: 2000
    }];

    sh.fixEndOfTurnOverlap(actions, ship);
    equal(actions[0].start, 3000);
    equal(actions[0].end, 4000);

    actions = [{
        type: 'Action',
        variant: 'move',
        unitID: 1,
        from: {x: 1, y: 1},
        to: {x: 2, y: 1},
        start: 1000,
        end: 2000
    }, {
        type: 'Action',
        variant: 'move',
        unitID: 2,
        from: {x: 2, y: 1},
        to: {x: 1, y: 1},
        start: 1000,
        end: 2000
    }];

    sh.fixEndOfTurnOverlap(actions, ship);
    //actions shouldn't change here
    equal(actions[0].start, 1000);
    equal(actions[0].end, 2000);
    equal(actions[1].start, 1000);
    equal(actions[1].end, 2000);

    actions = [{
        type: 'Action',
        variant: 'move',
        unitID: 1,
        from: {x: 1, y: 1},
        to: {x: 2, y: 2},
        start: 1000,
        end: 2000
    }, {
        type: 'Action',
        variant: 'move',
        unitID: 1,
        from: {x: 2, y: 2},
        to: {x: 3, y: 1},
        start: 2000,
        end: 3000
    }, {
        type: 'Action',
        variant: 'move',
        unitID: 2,
        from: {x: 2, y: 1},
        to: {x: 2, y: 2},
        start: 1000,
        end: 2000
    }];
    sh.fixEndOfTurnOverlap(actions, ship);
    ok(actions[0].start === 3000 ||
        actions[2].start === 3000);

});
