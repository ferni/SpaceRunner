/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, asyncTest, test, ok, equal, notEqual, deepEqual, start, th,
strictEqual, me, _, utils, TILE_SIZE, EngineVM, DoorVM,
FIRST_SCREEN, width, height, make, sh*/

module('main.js');
test('Globals are set', function() {
    'use strict';
    ok(FIRST_SCREEN, 'FIRST_SCREEN');
});



module('ship-building/ship');
asyncTest('buildAt', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    }, function(screen) {
        screen.ship.removeAll();
        ok(screen.ship.buildAt(th.shipPositions.free.x,
            th.shipPositions.free.y, 'Power'), 'could build Power');
        equal(screen.ship.built[0].type, 'Power',
            'first building is Power');
        start();
    });
});

asyncTest('add/at/removeAt', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    }, function(screen) {
        var x = th.shipPositions.free.x,
            y = th.shipPositions.free.y,
            engine = make.item('Engine', [x, y]);
        screen.ship.removeAll();
        //(ignores placement rules)
        screen.ship.addItem(engine);
        equal(screen.ship.built[0].type, 'Engine',
            'First building is engine after adding');

        //at
        equal(screen.ship.at(x, y).type, 'Engine', 'at(x, y) is engine');
        equal(screen.ship.at(x + 1, y).type, 'Engine',
            'at(x + 1, y) is engine');
        equal(screen.ship.at(x, y + 1).type, 'Engine',
            'at(x, y + 1) is engine');
        equal(screen.ship.at(x + 1, y + 1).type, 'Engine',
            'at(x + 1, y + 1) is engine');
        notEqual(screen.ship.at(x + 2, y + 1).type, 'Engine',
            'at(x + 2, y + 1) is not engine');
        notEqual(screen.ship.at(x, y - 1).type, 'Engine',
            'at(x, y - 1) is not engine');

        //removeAt
        screen.ship.removeAt(x + 1, y); //random engine tile
        equal(screen.ship.built.length, 0,
            'Ship has 0 buildings after removing');
        notEqual(screen.ship.at(x, y), 'Engine',
            'at(x, y) no longer Engine');
        notEqual(screen.ship.at(x, y + 1), 'Engine',
            'at(x, y + 1) no longer Engine');
        notEqual(screen.ship.at(x + 1, y), 'Engine',
            'at(x+1, y) no longer Engine');
        notEqual(screen.ship.at(x + 1, y + 1), 'Engine',
            'at(x+1, y + 1) no longer Engine');
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

        screen.ship.buildAt(x, y, 'Component');
        equal(screen.ship.built[0].type, 'Component',
            'Ship has Component built');
        equal(screen.ship.at(x, y).type, 'Component',
            'at(x,y) is Component');
        item = screen.ship.built[0];
        screen.ship.remove(item);
        notEqual(screen.ship.at(x, y).type, 'Component',
            'at(x,y) is no longer Component after removing');
        equal(screen.ship.built.length, 0, 'ship has no buildings');
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
        door = make.itemModel('door');
        ok(!door.canBuildAt(x, y, screen.ship),
            "Cannot build at x,y (there's no wall)");
        ok(!door.canBuildRotated(x, y, screen.ship),
            'It cannot be built rotated either');

        screen.ship.buildAt(x, y, 'wall');
        screen.ship.buildAt(x, y + 1, 'wall');

        ok(screen.ship.at(x, y) instanceof sh.items.Wall,
            'wall built at x, y');
        ok(screen.ship.at(x, y + 1) instanceof sh.items.Wall,
            'wall built at x, y + 1');
        ok(screen.ship.at(x, y).isVertical());
        ok(screen.ship.at(x, y + 1).isVertical());
        ok(!door.canBuildAt(x, y, screen.ship),
            'After building vertical wall,' +
            'door still cannot be built at x,y...');
        ok(door.canBuildRotated(x, y, screen.ship), '... but it can rotated.');

        screen.ship.buildAt(x, y, 'door');
        equal(screen.ship.at(x, y + 1).type, 'door',
            'at(x, y+1) is door (it should be rotated, that is, vertical)');
        notEqual(screen.ship.at(x + 1, y).type, 'door',
            'at(x+1,y) is not door');
        ok(screen.ship.at(x, y + 1).rotated(), "Door has 'rotated' status");
        start();
    });
});

asyncTest('at out of bounds', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    }, function(screen) {
        screen.ship.removeAll();
        ok(!screen.ship.map.at(-1, 0), 'map.at(-1,0) is nothing');
        ok(!screen.ship.map.at(width(), 0), 'map.at(WIDTH,0) is nothing');
        ok(!screen.ship.map.at(0, height()), 'map.at(0,HEIGHT) is nothing');
        start();
    });

});

asyncTest('fromJson', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    }, function(screen) {
        var power, door;
        screen.ship.removeAll();
        screen.ship.fromJson({'tmxName': 'test',
            'buildings': [{'type': 'Power', 'x': 0, 'y': 0},
                {'type': 'door', 'x': 2, 'y': 3, 'r': true}]});

        power = screen.ship.at(0, 0);
        equal(power.type, 'Power', 'Power successfully added to the ship');
        equal(power.x, 0, 'it has correct x position');
        equal(power.y, 0, 'it has correct y position');
        ok(!power.rotated(), 'Power is not rotated');

        door = screen.ship.at(2, 3);
        equal(door.type, 'door', 'door successfully added to the ship');
        equal(door.x, 2, 'it has correct x position');
        equal(door.y, 3, 'it has correct y position');
        ok(door.rotated(), 'door is rotated');

        equal(screen.ship.built.length, 2, 'ship has 2 buildings added');
        start();
    });
});

asyncTest('fromJson clears buildings', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    }, function(screen) {
        screen.ship.removeAll();
        ok(screen.ship.buildAt(th.shipPositions.free.x,
            th.shipPositions.free.y, 'Power'), 'Power successfully built');
        ok(screen.ship.buildAt(th.shipPositions.engine.x,
            th.shipPositions.engine.y, 'Engine'), 'Engine succesfully built');
        screen.ship.fromJson({'tmxName': 'test',
            'buildings': [{'type': 'wall', 'x': 0, 'y': 0}]});
        equal(screen.ship.built.length, 1,
            'ship has only one building after loading');
        equal(screen.ship.built[0].type, 'wall',
            'that only building is a wall (loaded through json)');

        screen.ship.fromJson({'tmxName': 'test', 'buildings': []});
        equal(screen.ship.built.length, 0,
            'ship has 0 buildings after loading empty array');
        start();
    });

});

asyncTest('toJson', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    }, function(screen) {
        var jsonObject, power, engine, buildings;
        screen.ship.removeAll();
        ok(screen.ship.buildAt(th.shipPositions.free.x,
            th.shipPositions.free.y, 'Power'), 'Power successfully built');
        ok(screen.ship.buildAt(th.shipPositions.engine.x,
            th.shipPositions.engine.y, 'Engine'), 'Engine succesfully built');
        screen.ship.at(th.shipPositions.engine.x, th.shipPositions.engine.y)
            .rotated(true);

        jsonObject = screen.ship.toJson();
        buildings = jsonObject.buildings;
        equal(buildings.length, 2, 'JSON object (array) has 2 objects');

        power = _.find(buildings, function(i) {
            return i.type === 'Power';
        });
        equal(power.x, th.shipPositions.free.x,
            'Power saved with correct x position');
        equal(power.y, th.shipPositions.free.y,
            'Power saved with correct y position');
        ok(!power.r, 'Power saved as not rotated');

        engine = _.find(buildings, function(i) {
            return i.type === 'Engine';
        });
        equal(engine.x, th.shipPositions.engine.x,
            'Engine saved with correct x position');
        equal(engine.y, th.shipPositions.engine.y,
            'Engine saved with correct y position');
        ok(engine.r, 'Engine saved as rotated');
        start();
    });
});
