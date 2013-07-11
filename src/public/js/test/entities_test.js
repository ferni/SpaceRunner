/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, asyncTest, test, ok, equal, notEqual, deepEqual, start, th,
me, utils, ui, Ship*/

module('entities/tile-entity.js');
test('Item.trueSize()', function() {
    'use strict';
    var door = make.item('door');
    deepEqual(door.size, [2, 1]);
    deepEqual(door.trueSize(), [2, 1]);

    door.rotated(true);
    deepEqual(door.trueSize(), [1, 2]);
    equal(door.trueSize(0), 1);
    equal(door.trueSize(1), 2);
});

test('Item onShip/offShip animations', function() {
    'use strict';
    var door = make.item('door');
    ok(!door.onShip(), 'door is not on ship');
    ok(!door.rotated(), 'door is not rotated');

    door.onShip(new Ship({tmxName: 'test'})); //not really ;)
    ok(door.isCurrentAnimation('h_open_close'),
        "on ship it has 'h_open_close' animation");

    door.rotated(true);
    door.onShip(false);
    ok(door.isCurrentAnimation('v_idle'));

});

module('entities/items.js');
test('engine proper placement', function() {
    'use strict';
    var ship;
    ship = new Ship({tmxName: 'test'});
    ok(ship.buildAt(th.shipPositions.engine.x, th.shipPositions.engine.y,
        'engine'), 'building succeeds');
});

test('engine invalid placement', function() {
    'use strict';
    var ship;
    ship = new Ship({tmxName: 'test'});
    ok(!ship.buildAt(th.shipPositions.free.x, th.shipPositions.free.y,
        'engine'), 'building fails');
});

test('weapon proper placement', function() {
    'use strict';
    var ship;
    ship = new Ship({tmxName: 'test'});
    ok(ship.buildAt(th.shipPositions.weapon.x, th.shipPositions.weapon.y,
        'weapon'), 'building succeeds');
});

test('weapon invalid placement', function() {
    'use strict';
    var ship;
    ship = new Ship({tmxName: 'test'});
    ok(!ship.buildAt(th.shipPositions.free.x, th.shipPositions.free.y,
        'weapon'), 'building fails');
});

test('Console placement', function() {
    'use strict';
    var x, y, ship;
    ship = new Ship({tmxName: 'test'});
    x = th.shipPositions.free.x;
    y = th.shipPositions.free.y;

    ok(!ship.buildAt(x, y, 'console'),
        'Console building fails in the middle of nowhere');
    ok(ship.buildAt(x, y, 'power'), 'Power built');
    ok(ship.buildAt(x - 1, y, 'console'),
        'Console building succeeds next to power');
});

asyncTest('Wall building', function() {
    'use strict';

    var x = th.shipPositions.free.x,
        y = th.shipPositions.free.y;
    th.loadScreen(function() {
            me.state.change('ship-building', {tmxName: 'test'});
        },
        function(screen) {
            screen.ship.buildAt(x, y, 'wall');
            ok(screen.mouseLockedOn, 'Mouse locked on something');
            equal(screen.mouseLockedOn.type, 'wall', 'Mouse locked on wall');

            th.mouseBegin(screen);
            th.leftClick(x + 2, y + 2);
            ok(!screen.mouseLockedOn, 'Mouse unlocked after click');
            equal(screen.ship.mapAt(x, y).type, 'wall');
            equal(screen.ship.mapAt(x + 1, y).type, 'wall');
            equal(screen.ship.mapAt(x + 2, y).type, 'wall');
            equal(screen.ship.mapAt(x + 2, y + 1).type, 'wall');
            equal(screen.ship.mapAt(x + 2, y + 2).type, 'wall');

            th.mouseEnd();
            start();
        });
});

asyncTest('Wall building canceled by escape key', function() {
    'use strict';
    var x = th.shipPositions.free.x,
        y = th.shipPositions.free.y;
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    }, function(screen) {
        screen.choose('wall');
        th.mouseBegin(screen);
        th.leftClick(x, y);
        equal(screen.mouseLockedOn.type, 'wall', 'Mouse locked on wall');

        th.moveMouse(x + 2, y + 2);
        th.mouseEnd();
        //entire wall is seen on the screen...
        equal(screen.mapAt(x, y).type, 'wall', 'wall appears at x,y');
        equal(screen.mapAt(x + 1, y).type, 'wall');
        equal(screen.mapAt(x + 2, y).type, 'wall');
        equal(screen.mapAt(x + 2, y + 1).type, 'wall');
        equal(screen.mapAt(x + 2, y + 2).type, 'wall');
        //...but only the first one is built
        equal(screen.ship.mapAt(x, y).type, 'wall');
        notEqual(screen.ship.mapAt(x + 1, y).type, 'wall');
        notEqual(screen.ship.mapAt(x + 2, y).type, 'wall');
        notEqual(screen.ship.mapAt(x + 2, y + 1).type, 'wall');
        notEqual(screen.ship.mapAt(x + 2, y + 2).type, 'wall');

        me.input.triggerKeyEvent(me.input.KEY.ESC, true);
        screen.update();
        me.input.triggerKeyEvent(me.input.KEY.ESC, false);

        ok(!screen.mouseLockedOn,
            'Mouse no longer locked on wall after ESC key');
        //wall does no longer appear on the screen (except the cursor)
        equal(screen.mapAt(x, y).type, 'wall',
            'Cursor still appears on the screen');
        notEqual(screen.mapAt(x + 1, y).type, 'wall',
            'The rest of the wall is gone');
        notEqual(screen.mapAt(x + 2, y).type, 'wall');
        notEqual(screen.mapAt(x + 2, y + 1).type, 'wall');
        notEqual(screen.mapAt(x + 2, y + 2).type, 'wall');
        //the first wall has been removed
        notEqual(screen.ship.mapAt(x, y).type, 'wall');
        start();
    });
});

