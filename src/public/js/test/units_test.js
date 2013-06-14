/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, asyncTest, test, ok, equal, notEqual, deepEqual, start, th,
 me, utils, ui, Ship*/

module('units.js');
asyncTest('cropScript', function(){
    th.loadScreen(function() {
        me.state.change(me.state.BATTLE, {tmxName: 'test',
            turnDuration: 3,
            collisionResolution: collisionResolutions.none});
    }, function(screen) {
        var ship = me.game.ship,
            unit;
        unit = ship.putUnit({speed: 1});
        screen.generateScripts(unit, {x: unit.x() + 3, y: unit.y()});
        equal(unit.script.length, 4);
        equal(unit.script[1].time, 1000);
        unit.cropScript(1000);
        equal(unit.script.length, 2);
        equal(unit.script[1].time, 1000);
        start();
    });
});

test('getTimeWindow', function(){
    var unit = new Unit(1, 1, {turnDuration: 10}),
        timeWindow;
    unit.script = [{pos:{x:1,y:1}, time:0},
        {pos:{x:1,y:1}, time:2},
        {pos:{x:1,y:1}, time:3}];
    timeWindow = unit.getTimeWindow(2);
    equal(timeWindow.from, 3, 'time window from 3');
    equal(timeWindow.to, 10, 'time window to 10 (end of turn)');
});

