/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, asyncTest, test, ok, equal, notEqual, deepEqual, start, th,
strictEqual, me, _, utils, TILE_SIZE, EngineItem, DoorItem,
FIRST_SCREEN, width, height */

module('main.js');
test('Globals are set', function() {
    'use strict';
     ok(FIRST_SCREEN, 'FIRST_SCREEN');
});



module('main.js/ship');

asyncTest('buildAt', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    }, function(screen) {
        screen.ship.removeAll();
        ok(screen.ship.buildAt(th.shipPositions.free.x,
            th.shipPositions.free.y, 'power'), 'could build power');
        equal(screen.ship.buildings()[0].type, 'power',
            'first building is power');
        start();
    });
});

asyncTest('add/mapAt/removeAt', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    }, function(screen) {
        var x = th.shipPositions.free.x,
        y = th.shipPositions.free.y,
        engine = new EngineItem(x, y);
        screen.ship.removeAll();
        //(ignores placement rules)
        screen.ship.add(engine);
        equal(screen.ship.buildings()[0].type, 'engine',
            'First building is engine after adding');

        //mapAt
        equal(screen.ship.mapAt(x, y).type, 'engine', 'mapAt(x, y) is engine');
        equal(screen.ship.mapAt(x + 1, y).type, 'engine',
            'mapAt(x + 1, y) is engine');
        equal(screen.ship.mapAt(x, y + 1).type, 'engine',
            'mapAt(x, y + 1) is engine');
        equal(screen.ship.mapAt(x + 1, y + 1).type, 'engine',
            'mapAt(x + 1, y + 1) is engine');
        notEqual(screen.ship.mapAt(x + 2, y + 1).type, 'engine',
            'mapAt(x + 2, y + 1) is not engine');
        notEqual(screen.ship.mapAt(x, y - 1).type, 'engine',
            'mapAt(x, y - 1) is not engine');

        //removeAt
        screen.ship.removeAt(x + 1, y); //random engine tile
        equal(screen.ship.buildings().length, 0,
            'Ship has 0 buildings after removing');
        notEqual(screen.ship.mapAt(x, y), 'engine',
            'mapAt(x, y) no longer engine');
        notEqual(screen.ship.mapAt(x, y + 1), 'engine',
            'mapAt(x, y + 1) no longer engine');
        notEqual(screen.ship.mapAt(x + 1, y), 'engine',
            'mapAt(x+1, y) no longer engine');
        notEqual(screen.ship.mapAt(x + 1, y + 1), 'engine',
            'mapAt(x+1, y + 1) no longer engine');
        start();
    });
});

asyncTest('remove', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    }, function(screen) {
        var x, y, item;
        x = th.shipPositions.free.x;
        y = th.shipPositions.free.y;
        screen.ship.removeAll();

        screen.ship.buildAt(x, y, 'component');
        equal(screen.ship.buildings()[0].type, 'component',
            'Ship has component built');
        equal(screen.ship.mapAt(x, y).type, 'component',
            'mapAt(x,y) is component');
        item = screen.ship.buildings()[0];
        screen.ship.remove(item);
        notEqual(screen.ship.mapAt(x, y).type, 'component',
            'mapAt(x,y) is no longer component after removing');
        equal(screen.ship.buildings().length, 0, 'ship has no buildings');
        start();
    });
});

asyncTest('buildAt rotates item when can only be built rotated', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    }, function(screen) {
        var x, y, door;
        x = th.shipPositions.free.x;
        y = th.shipPositions.free.y;
        door = new DoorItem();
        ok(!door.canBuildAt(x, y, screen.ship),
            "Cannot build at x,y (there's no wall)");
        ok(!door.canBuildRotated(x, y, screen.ship),
            'It cannot be built rotated either');

        screen.ship.buildAt(x, y, 'wall');
        screen.ship.buildAt(x, y + 1, 'wall');
        //update wall animations, important for door placement rules
        me.game.update();
        ok(!door.canBuildAt(x, y, screen.ship),
            'After building vertical wall,' +
            'door still cannot be built at x,y...');
        ok(door.canBuildRotated(x, y, screen.ship), '... but it can rotated.');

        screen.ship.buildAt(x, y, 'door');
        equal(screen.ship.mapAt(x, y + 1).type, 'door',
            'mapAt(x, y+1) is door (it should be rotated, that is, vertical)');
        notEqual(screen.ship.mapAt(x + 1, y).type, 'door',
            'mapAt(x+1,y) is not door');
        ok(screen.ship.mapAt(x, y + 1).rotated(), "Door has 'rotated' status");
        start();
    });
});

asyncTest('mapAt out of bounds', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    }, function(screen) {
        screen.ship.removeAll();
        strictEqual(screen.ship.mapAt(-1, 0), null,
            'mapAt(-1,0) is null');
        strictEqual(screen.ship.mapAt(width(), 0), null,
            'mapAt(WIDTH,0) is null');
        strictEqual(screen.ship.mapAt(0, height()), null,
            'mapAt(0,HEIGHT) is null');
        start();
    });

});

asyncTest('fromJsonString', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    }, function(screen) {
        var power, door;
        screen.ship.removeAll();
        screen.ship.fromJsonString('{"tmxName":"test",' +
            '"buildings":[{"type":"power", "x":0, "y":0},' +
            '{"type":"door", "x":2, "y":3, "rotated":true}]}');

        power = screen.ship.mapAt(0, 0);
        equal(power.type, 'power', 'power successfully added to the ship');
        equal(power.x, 0, 'it has correct x position');
        equal(power.y, 0, 'it has correct y position');
        ok(!power.rotated(), 'power is not rotated');

        door = screen.ship.mapAt(2, 3);
        equal(door.type, 'door', 'door successfully added to the ship');
        equal(door.x, 2, 'it has correct x position');
        equal(door.y, 3, 'it has correct y position');
        ok(door.rotated(), 'door is rotated');

        equal(screen.ship.buildings().length, 2, 'ship has 2 buildings added');
        start();
    });
});

asyncTest('fromJsonString clears buildings', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    }, function(screen) {
        screen.ship.removeAll();
        ok(screen.ship.buildAt(th.shipPositions.free.x,
            th.shipPositions.free.y, 'power'), 'power successfully built');
        ok(screen.ship.buildAt(th.shipPositions.engine.x,
            th.shipPositions.engine.y, 'engine'), 'engine succesfully built');
        screen.ship.fromJsonString('{"tmxName":"test",' +
            '"buildings":[{"type":"wall", "x":0, "y":0}]}');
        equal(screen.ship.buildings().length, 1,
            'ship has only one building after loading');
        equal(screen.ship.buildings()[0].type, 'wall',
            'that only building is a wall (loaded through json)');

        screen.ship.fromJsonString('{"tmxName":"test","buildings":[]}');
        equal(screen.ship.buildings().length, 0,
            'ship has 0 buildings after loading empty array');
        start();
    });

});

asyncTest('toJsonString', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    }, function(screen) {
        var jsonObject, power, engine, buildings;
        screen.ship.removeAll();
        ok(screen.ship.buildAt(th.shipPositions.free.x,
            th.shipPositions.free.y, 'power'), 'power successfully built');
        ok(screen.ship.buildAt(th.shipPositions.engine.x,
            th.shipPositions.engine.y, 'engine'), 'engine succesfully built');
        screen.ship.mapAt(th.shipPositions.engine.x, th.shipPositions.engine.y)
            .rotated(true);

        jsonObject = JSON.parse(screen.ship.toJsonString());
        buildings = jsonObject.buildings;
        equal(buildings.length, 2, 'JSON object (array) has 2 objects');

        power = _.find(buildings, function(i) {
            return i.type === 'power';
        });
        equal(power.x, th.shipPositions.free.x,
            'power saved with correct x position');
        equal(power.y, th.shipPositions.free.y,
            'power saved with correct y position');
        ok(!power.rotated, 'power saved as not rotated');

        engine = _.find(buildings, function(i) {
            return i.type === 'engine';
        });
        equal(engine.x, th.shipPositions.engine.x,
            'engine saved with correct x position');
        equal(engine.y, th.shipPositions.engine.y,
            'engine saved with correct y position');
        ok(engine.rotated, 'engine saved as rotated');
        start();
    });
});
