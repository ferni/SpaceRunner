/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global */

module('orders');
test('script creation', function(){

    var order, script,
        ship = new sh.Ship({tmxName: 'test'}),
        unit = ship.putUnit({speed: 1});
    unit.owner = new sh.Player({id: 1, name:'juan'});
    order = sh.make.moveOrder(unit, {x: unit.x + 2, y: unit.y});
    ok(sh.verifyOrder(order, ship, 1), 'Order is valid');
    script = sh.createScript([order], ship);
    equal(script.length, 2, 'Script has two actions');
    equal(script[0].start, 0, 'First action starts at 0');
    equal(script[1].start, 1000, 'Second action starts at 1000');
});

test('fix actions overlap', function(){
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