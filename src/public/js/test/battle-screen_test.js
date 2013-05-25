/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, asyncTest, test, ok, equal, notEqual, deepEqual, start, th,
 me, utils, ui, Ship*/

module('battle-screen.js');
asyncTest('getTileClearStatus', function(){
    th.loadScreen(function() {
        me.state.change(me.state.BATTLE,
            {
                tmxName: 'test',
                turnDuration: 4,
                collisionResolution: collisionResolutions.none
            });
    }, function(screen) {
        var ship = me.game.ship,
            unit1, unit2,
            x = th.shipPositions.free.x,
            y = th.shipPositions.free.y;

        unit1 = new Unit(x, y + 1, {speed: 1});
        unit2 = new Unit(x + 1, y, {speed: 1});
        ship.add(unit1);
        ship.add(unit2);
        screen.generateScripts(unit1, {x: x + 2, y: y + 1});//(moves two right)
        screen.generateScripts(unit2, {x: x + 1, y: y + 2});//(moves two down)
        //the units cross each other forming a cross
        equal(unit1.script.length, 3);
        equal(unit1.script[2].pos.x, x + 2);
        equal(unit2.script.length, 3);
        equal(unit2.script[2].pos.y, y + 2);

        strictEqual(screen.getTileClearStatus({x: unit1.x(), y: unit1.y()},
            {from:1000, to:1500}, unit2).isClear, true, 'pos of unit1 clear from 1 s');
        notStrictEqual(screen.getTileClearStatus({x: unit1.x(), y: unit1.y()},
            {from:999, to:1500}, unit2).isClear, true, 'pos of unit1 occupied before 1 s');



        start();
    });
});