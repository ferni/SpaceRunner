/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, asyncTest, test, ok, equal, notEqual, deepEqual, start, th,
me, utils, ui, ship*/

module('entities/core.js');
asyncTest('ItemObject.trueSize()', function() {
    'use strict';
    th.onLevelReady(function() {
        var door = utils.makeItem('door');
        deepEqual(door.size, [2, 1]);
        deepEqual(door.trueSize(), [2, 1]);

        door.rotated(true);
        deepEqual(door.trueSize(), [1, 2]);
        equal(door.trueSize(0), 1);
        equal(door.trueSize(1), 2);
        start();
    });
});

asyncTest('ItemObject onShip/offShip animations', function() {
    'use strict';
    th.onLevelReady(function() {
        var door = utils.makeItem('door');
        deepEqual(door.offShipAnimations, ['idle']);
        deepEqual(door.onShipAnimations, ['h_open_close', 'v_open_close']);
        ok(!door.onShip(), 'door is not on ship');
        ok(!door.rotated(), 'door is not rotated');

        door.onShip(true); //not really ;)
        ok(door.isCurrentAnimation('h_open_close'),
            "on ship it has 'h_open_close' animation");

        door.rotated(true);
        door.onShip(false);
        ok(door.isCurrentAnimation('idle'), 'door is rotated and off ship,' +
            " but since it doesn't have off ship rotated animation," +
            " it uses 'idle'");
        start();
    });
});

module('entities/items.js');
asyncTest('engine proper placement', function() {
    'use strict';
    th.onLevelReady(function() {
        me.state.current().ship.removeAll();
        ok(me.state.current().ship.buildAt(th.shipPositions.engine.x, th.shipPositions.engine.y,
            'engine'), 'building succeeds');
        start();
    });
});

asyncTest('engine invalid placement', function() {
    'use strict';
    th.onLevelReady(function() {
        me.state.current().ship.removeAll();
        ok(!me.state.current().ship.buildAt(th.shipPositions.free.x, th.shipPositions.free.y,
            'engine'), 'building fails');
        start();
    });
});

asyncTest('weapon proper placement', function() {
    'use strict';
    th.onLevelReady(function() {
        me.state.current().ship.removeAll();
        ok(me.state.current().ship.buildAt(th.shipPositions.weapon.x, th.shipPositions.weapon.y,
            'weapon'), 'building succeeds');
        start();
    });
});

asyncTest('weapon invalid placement', function() {
    'use strict';
    th.onLevelReady(function() {
        me.state.current().ship.removeAll();
        ok(!me.state.current().ship.buildAt(th.shipPositions.free.x, th.shipPositions.free.y,
            'weapon'), 'building fails');
        start();
    });
});

asyncTest('Console placement', function() {
    'use strict';
    th.onLevelReady(function() {
        var x, y;
        me.state.current().ship.removeAll();
        x = th.shipPositions.free.x;
        y = th.shipPositions.free.y;

        ok(!me.state.current().ship.buildAt(x, y, 'console'),
            'Console building fails in the middle of nowhere');
        ok(me.state.current().ship.buildAt(x, y, 'power'), 'Power built');
        ok(me.state.current().ship.buildAt(x - 1, y, 'console'),
            'Console building succeeds next to power');
        start();
    });
});

asyncTest('Wall building', function() {
    'use strict';
    th.restartGame(function() {
        var x = th.shipPositions.free.x,
        y = th.shipPositions.free.y;
        me.state.current().ship.buildAt(x, y, 'wall');
        equal(me.state.current().mouseLockedOn.type, 'wall', 'Mouse locked on wall');

        th.mouseBegin();
        th.setMouse(x + 2, y);
        me.state.current().mouseMove();
        me.state.current().mouseDown({
            which: me.input.mouse.LEFT
        });
        me.state.current().mouseUp({
            which: me.input.mouse.LEFT
        });
        th.setMouse(x + 2, y + 2);
        me.state.current().mouseMove();
        me.state.current().mouseDbClick({
            which: me.input.mouse.LEFT
        });
        ok(!me.state.current().mouseLockedOn, 'Mouse unlocked after double click');
        equal(me.state.current().ship.mapAt(x, y).type, 'wall');
        equal(me.state.current().ship.mapAt(x + 1, y).type, 'wall');
        equal(me.state.current().ship.mapAt(x + 2, y).type, 'wall');
        equal(me.state.current().ship.mapAt(x + 2, y + 1).type, 'wall');
        equal(me.state.current().ship.mapAt(x + 2, y + 2).type, 'wall');

        th.mouseEnd();

        start();
    });
});

asyncTest('Wall building canceled by escape key', function() {
    'use strict';
    th.restartGame(function() {
        var x = th.shipPositions.free.x,
        y = th.shipPositions.free.y;
        me.state.current().choose('wall');
        th.mouseBegin();
        th.leftClick(x, y);
        equal(me.state.current().mouseLockedOn.type, 'wall', 'Mouse locked on wall');

        th.leftClick(x + 2, y);
        th.leftClick(x + 2, y + 2);
        th.mouseEnd();
        //entire wall is seen on the screen...
        equal(me.state.current().mapAt(x, y).type, 'wall', 'wall appears at x,y');
        equal(me.state.current().mapAt(x + 1, y).type, 'wall');
        equal(me.state.current().mapAt(x + 2, y).type, 'wall');
        equal(me.state.current().mapAt(x + 2, y + 1).type, 'wall');
        equal(me.state.current().mapAt(x + 2, y + 2).type, 'wall');
        //...but only the first one is built
        equal(me.state.current().ship.mapAt(x, y).type, 'wall');
        notEqual(me.state.current().ship.mapAt(x + 1, y).type, 'wall');
        notEqual(me.state.current().ship.mapAt(x + 2, y).type, 'wall');
        notEqual(me.state.current().ship.mapAt(x + 2, y + 1).type, 'wall');
        notEqual(me.state.current().ship.mapAt(x + 2, y + 2).type, 'wall');

        me.input.triggerKeyEvent(me.input.KEY.ESC, true);
        me.state.current().update();
        me.input.triggerKeyEvent(me.input.KEY.ESC, false);

        ok(!me.state.current().mouseLockedOn, 'Mouse no longer locked on wall after ESC key');
        //wall does no longer appear on the screen (except the cursor)
        equal(me.state.current().mapAt(x, y).type, 'wall',
            'Cursor still appears on the screen');
        notEqual(me.state.current().mapAt(x + 1, y).type, 'wall',
            'The rest of the wall is gone');
        notEqual(me.state.current().mapAt(x + 2, y).type, 'wall');
        notEqual(me.state.current().mapAt(x + 2, y + 1).type, 'wall');
        notEqual(me.state.current().mapAt(x + 2, y + 2).type, 'wall');
        //the first wall has been removed
        notEqual(me.state.current().ship.mapAt(x, y).type, 'wall');
        start();
    });
});

