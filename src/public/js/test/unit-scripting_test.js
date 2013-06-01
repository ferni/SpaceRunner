/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me*/

module('unit-scripting.js');


test('waitForClearing: getTileClearStatus, check clear', function() {
    var ship, u1, u2,
        scripter,
        turnDuration = 10,
        clearStatus;
    me.game.ship = new Ship({tmxName: 'test'});
    ship = me.game.ship;
    u1 = ship.putUnit({turnDuration: turnDuration});
    u2 = ship.putUnit({turnDuration: turnDuration});

    u1.script = [{pos:{x:1, y:1}, time:3}, {pos:{x:2, y:1}, time:4}];
    scripter = new WaitForClearingScripter(turnDuration);
    clearStatus = scripter.getTileClearStatus({x:1, y:1},{from:3.5, to:3.8}, u2);
    strictEqual(clearStatus.isClear, false, 'tile (1,1) not clear in 3.5-3.8');
    equal(clearStatus.when, 4, 'tile (1,1) will be clear by 4');

    clearStatus = scripter.getTileClearStatus({x:1, y:1},{from:4, to:5}, u2);
    strictEqual(clearStatus.isClear, true, 'tile (1,1) clear in 4-5');

});

test('waitForClearing: getTileClearStatus, end of turn', function() {
    var ship, u1, u2,
        scripter,
        turnDuration = 10,
        clearStatus;
    me.game.ship = new Ship({tmxName: 'test'});
    ship = me.game.ship;
    u1 = ship.putUnit({turnDuration: turnDuration});
    u2 = ship.putUnit({turnDuration: turnDuration});

    u1.script = [{pos:{x:1, y:1}, time:3}, {pos:{x:2, y:1}, time:4}];
    scripter = new WaitForClearingScripter(turnDuration);
    clearStatus = scripter.getTileClearStatus({x:2, y:1},{from:6, to:8}, u2);
    strictEqual(clearStatus.isClear, false, 'tile (2,1) is not clear');
    strictEqual(clearStatus.when, false, 'tile (2,1) will never be clear');
});

test('waitForClearing: getTileClearStatus, repeated frame', function() {
    var ship, u1, u2,
        scripter,
        turnDuration = 10,
        clearStatus;
    me.game.ship = new Ship({tmxName: 'test'});
    ship = me.game.ship;
    u1 = ship.putUnit({turnDuration: turnDuration});
    u2 = ship.putUnit({turnDuration: turnDuration});

    u1.script = [{pos:{x:1, y:1}, time:3}, {pos:{x:1, y:1}, time:4}];
    scripter = new WaitForClearingScripter(turnDuration);
    clearStatus = scripter.getTileClearStatus({x:1, y:1},{from:4, to:5}, u2);
    strictEqual(clearStatus.isClear, false, 'tile (1,1) not clear in 4-5');
    strictEqual(clearStatus.when, false, 'tile (1,1) will never be clear');

    clearStatus = scripter.getTileClearStatus({x:1, y:1},{from:3, to:3.5}, u2);
    strictEqual(clearStatus.isClear, false, 'tile (1,1) not clear in 3-3.5');
    strictEqual(clearStatus.when, false, 'tile (1,1) will never be clear');
});

test('waitForClearing: getTileClearStatus, repeated frame 2', function() {
    var ship, u1, u2,
        scripter,
        turnDuration = 10,
        clearStatus;
    me.game.ship = new Ship({tmxName: 'test'});
    ship = me.game.ship;
    u1 = ship.putUnit({turnDuration: turnDuration});
    u2 = ship.putUnit({turnDuration: turnDuration});

    u1.script = [{pos:{x:1, y:1}, time:3},
        {pos:{x:1, y:1}, time:4},
        {pos:{x:2, y:1}, time:5}];
    scripter = new WaitForClearingScripter(turnDuration);
    clearStatus = scripter.getTileClearStatus({x:1, y:1},{from:3, to:4}, u2);
    strictEqual(clearStatus.isClear, false, 'tile (1,1) not clear in 3-4');
    strictEqual(clearStatus.when, 5, 'tile (1,1) clear by 5');

});

test('waitForClearing: getTileClearStatus, narrow window', function() {
    var ship, u1, u2,
        scripter,
        turnDuration = 10,
        clearStatus;
    me.game.ship = new Ship({tmxName: 'test'});
    ship = me.game.ship;
    u1 = ship.putUnit({turnDuration: turnDuration});
    u2 = ship.putUnit({turnDuration: turnDuration});

    u1.script = [{pos:{x:1, y:1}, time:3},
        {pos:{x:2, y:1}, time:4},
        {pos:{x:1, y:1}, time:5}];
    scripter = new WaitForClearingScripter(turnDuration);
    clearStatus = scripter.getTileClearStatus({x:1, y:1},{from:4, to:5}, u2);
    strictEqual(clearStatus.isClear, true, 'tile (1,1) clear in 4-5');
    clearStatus = scripter.getTileClearStatus({x:1, y:1},{from:3.9, to:5}, u2);
    strictEqual(clearStatus.isClear, false, 'tile (1,1) not clear in 3.9-5');
    clearStatus = scripter.getTileClearStatus({x:1, y:1},{from:4, to:5.1}, u2);
    strictEqual(clearStatus.isClear, false, 'tile (1,1) not clear in 4-5.1');
});

test('waitForClearing: getTileClearStatus, multiple units', function() {
    var ship, u1, u2, u3,
        scripter,
        turnDuration = 10,
        clearStatus;
    me.game.ship = new Ship({tmxName: 'test'});
    ship = me.game.ship;
    u1 = ship.putUnit({turnDuration: turnDuration});
    u2 = ship.putUnit({turnDuration: turnDuration});
    u3 = ship.putUnit({turnDuration: turnDuration});
    u1.x(1).y(1)
        .script = [{pos:{x:1, y:1}, time:3},
                    {pos:{x:2, y:1}, time:4},//4 - 5
                    {pos:{x:1, y:1}, time:5}];
    u2.x(2).y(2)
        .script = [{pos:{x:2, y:2}, time:3},
                    {pos:{x:2, y:1}, time:5.4},//5.4 - 7
                    {pos:{x:2, y:2}, time:7}];

    equal(u1.script.length, 3, 'u1 script properly set');
    scripter = new WaitForClearingScripter(turnDuration);
    clearStatus = scripter.getTileClearStatus({x:2, y:1}, {from:4, to:4.5}, u3);
    strictEqual(clearStatus.isClear, false, 'tile (1,1) not clear in 4-4.5');
    equal(clearStatus.when, 7, 'tile (1,1) will be clear by 7');

    clearStatus = scripter.getTileClearStatus({x:2, y:1}, {from:4, to:4.4}, u3);
    strictEqual(clearStatus.isClear, false, 'tile (1,1) not clear in 4-4.4');
    equal(clearStatus.when, 5, 'tile (1,1) will be clear by 5');

});