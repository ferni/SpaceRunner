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
    order = new sh.orders.Move({
        unitID: unit.id,
        destination: {x: unit.x + 2, y: unit.y}
    });
    ok(order.isValid(ship, 1), 'Order is valid');
    script = sh.createScript([[order]], ship, 3000, true);
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
    order = new sh.orders.Move({
        unitID: unit.id,
        destination: {x: unit.x + 2, y: unit.y}
    });
    ok(order.isValid(ship, 1), 'Order is valid');
    sh.createScript([[order]], ship, 5000, true);
    equal(unit.x, prevX + 2, 'The unit position has been modified');
});

test('script creation, carry over actions to next turn', function() {
    'use strict';
    var ship = new sh.Ship({tmxName: 'test'}),
        unit = ship.putUnit({speed: 1}),
        TestAction = sh.Action.extendShared({
            init: function(json) {
                this.parent(json);
                this.setJson({
                    type: 'TestAction',
                    properties: [],
                    json: json
                });
                this.updateModelChanges();
            },
            updateModelChanges: function() {
                this.modelChanges = [];
                this.addChange(0, function(ship) {
                    if (ship.changedAt0) {
                        ship.changedAt0++;
                    } else {
                        ship.changedAt0 = 1;
                    }
                });
                this.addChange(150, function(ship) {
                    if (ship.changedAt150) {
                        ship.changedAt150++;
                    } else {
                        ship.changedAt150 = 1;
                    }
                });
                this.addChange(201, function(ship) {
                    if (ship.changedAt201) {
                        ship.changedAt201++;
                    } else {
                        ship.changedAt201 = 1;
                    }
                });
            }
        });
    unit.ownerID = 1;
    unit.test_firstTime = true;
    unit.getActions = function(turnTime) {
        if (this.test_firstTime) {
            this.test_firstTime = false;
            return [new TestAction({
                time: turnTime
            })];
        }
        return [];
    };
    sh.createScript([[]], ship, 100, true);
    equal(ship.changedAt0, 1, 'First change went through.');
    ok(!ship.changedAt150, 'Not the second one.');
    sh.createScript([[]], ship, 100, true);
    equal(ship.changedAt0, 1, 'Don\'t run first change again.');
    equal(ship.changedAt150, 1, 'Second change went through.');
    ok(!ship.changedAt201, 'Not the third one.');
    sh.createScript([[]], ship, 100, true);
    equal(ship.changedAt0, 1, 'Don\'t run first change again.');
    equal(ship.changedAt150, 1, 'Don\'t run second change again.');
    equal(ship.changedAt201, 1, 'Third change went through.');
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

test('OrderPackage serialization', function() {
    'use strict';
    var orders = {
            '1': [new sh.orders.Move({
                unitID: 1,
                destination: {x: 1, y: 2}
            }),
                new sh.orders.Move({
                    unitID: 1,
                    destination: {x: 2, y: 2}
                })
                ],
            '2': [new sh.orders.Move({
                unitID: 2,
                destination: {x: 7, y: 7}
            })]
        },
        orderPackage = new sh.OrderPackage(orders),
        json = orderPackage.toJson(),
        reconstructed = new sh.OrderPackage().fromJson(json);
    ok(JSON.stringify(json), 'JSON stringify does not throw error.');
    equal(reconstructed.orders['1'].length, 2, '2 orders for Unit 1');
    equal(reconstructed.orders['2'].length, 1, '1 order for Unit 2');
    ok(reconstructed.orders['1'][0] instanceof sh.Order,
        '1st order instance of sh.Order');
    deepEqual(reconstructed.orders['1'][0].destination, {x: 1, y: 2},
        '1st order correct destination');
    ok(reconstructed.orders['1'][1] instanceof sh.Order,
        '2nd order instance of sh.Order');
    deepEqual(reconstructed.orders['1'][1].destination, {x: 2, y: 2},
        '2nd order correct destination');
    ok(reconstructed.orders['2'][0] instanceof sh.Order,
        '3rd order instance of sh.Order');
    deepEqual(reconstructed.orders['2'][0].destination, {x: 7, y: 7},
        '3rd order correct destination');
});
