/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, asyncTest, test, ok, equal, notEqual, deepEqual, start, th,
strictEqual, me, _, utils, ui, ship, screen, WIDTH, HEIGHT, TILE_SIZE,
EngineItem, DoorItem*/

module('main.js/PlayScreen');
asyncTest('Globals are set', function() {
    'use strict';
    th.onLevelReady(function() {
        ok(TILE_SIZE, 'TILE_SIZE');
        ok(WIDTH, 'WIDTH');
        ok(HEIGHT, 'HEIGHT');
        ok(ship, 'ship');
        ok(ui, 'ui');
        start();
    });
});

asyncTest('ESC key un-chooses the item', function() {
    'use strict';
    th.restartGame(function() {
        ui.choose('power');
        ok(ui.chosen, 'something chosen');
        me.input.triggerKeyEvent(me.input.KEY.ESC, true);
        screen.update();
        me.input.triggerKeyEvent(me.input.KEY.ESC, false);
        ok(!ui.chosen, 'Nothing is chosen after hitting escape');
        start();
    });
});

asyncTest('mouseDbClick does not give an error when mouse is not locked',
    function() {
    'use strict';
    th.onLevelReady(function() {
        equal(ui.mouseLockedOn, null, 'Mouse is not locked');
        screen.mouseDbClick({
            which: me.input.mouse.LEFT
        });
        start();
    });
});

asyncTest('right click removes item', function() {
    'use strict';
    th.restartGame(function() {
        var x = th.shipPositions.free.x,
        y = th.shipPositions.free.y;
        ship.buildAt(x, y, 'component');
        equal(ship.mapAt(x, y).type, 'component', 'Component built');
        th.mouseBegin();
        th.rightClick(x + 1, y + 1); //botton right of component
        th.mouseEnd();
        notEqual(ship.mapAt(x, y).type, 'component', 'Component removed');
        start();
    });
});

asyncTest('drag and drop', function() {
    'use strict';
    th.restartGame(function() {
        var power;
        ok(ship.buildAt(3, 4, 'power'), 'power succesfully built');
        th.mouseBegin();
        th.moveMouse(3, 4);
        screen.mouseDown({
            which: me.input.mouse.LEFT
        });
        equal(ui.dragging.type, 'power', 'power being dragged');

        th.moveMouse(5, 4);
        screen.mouseUp({
            which: me.input.mouse.LEFT
        });
        ok(!ui.dragging, 'not dragging after mouse up');
        notEqual(ship.mapAt(3, 4).type, 'power',
            'power is not on original position');
        power = ship.mapAt(5, 4);
        equal(power.x(), 5, 'power is at new position');
        th.mouseEnd();
        start();
    });
});


module('main.js/ship');

asyncTest('buildAt', function() {
    'use strict';
    th.onLevelReady(function() {
        ship.removeAll();
        ok(ship.buildAt(th.shipPositions.free.x, th.shipPositions.free.y,
            'power'), 'could build power');
        equal(ship.buildings()[0].type, 'power', 'first building is power');
        start();
    });
});

asyncTest('add/mapAt/removeAt', function() {
    'use strict';
    th.onLevelReady(function() {
        ship.removeAll();
        var x = th.shipPositions.free.x,
        y = th.shipPositions.free.y,
        engine = new EngineItem(x, y);
        //(ignores placement rules)
        ship.add(engine);
        equal(ship.buildings()[0].type, 'engine',
            'First building is engine after adding');

        //mapAt
        equal(ship.mapAt(x, y).type, 'engine', 'mapAt(x, y) is engine');
        equal(ship.mapAt(x + 1, y).type, 'engine',
            'mapAt(x + 1, y) is engine');
        equal(ship.mapAt(x, y + 1).type, 'engine',
            'mapAt(x, y + 1) is engine');
        equal(ship.mapAt(x + 1, y + 1).type, 'engine',
            'mapAt(x + 1, y + 1) is engine');
        notEqual(ship.mapAt(x + 2, y + 1).type, 'engine',
            'mapAt(x + 2, y + 1) is not engine');
        notEqual(ship.mapAt(x, y - 1).type, 'engine',
            'mapAt(x, y - 1) is not engine');

        //removeAt
        ship.removeAt(x + 1, y); //random engine tile
        equal(ship.buildings().length, 0,
            'Ship has 0 buildings after removing');
        notEqual(ship.mapAt(x, y), 'engine',
            'mapAt(x, y) no longer engine');
        notEqual(ship.mapAt(x, y + 1), 'engine',
            'mapAt(x, y + 1) no longer engine');
        notEqual(ship.mapAt(x + 1, y), 'engine',
            'mapAt(x+1, y) no longer engine');
        notEqual(ship.mapAt(x + 1, y + 1), 'engine',
            'mapAt(x+1, y + 1) no longer engine');
        start();
    });
});

asyncTest('remove', function() {
    'use strict';
    th.onLevelReady(function() {
        ship.removeAll();
        var x, y, item;
        x = th.shipPositions.free.x;
        y = th.shipPositions.free.y;

        ship.buildAt(x, y, 'component');
        equal(ship.buildings()[0].type, 'component',
            'Ship has component built');
        equal(ship.mapAt(x, y).type, 'component', 'mapAt(x,y) is component');
        item = ship.buildings()[0];
        ship.remove(item);
        notEqual(ship.mapAt(x, y).type, 'component',
            'mapAt(x,y) is no longer component after removing');
        equal(ship.buildings().length, 0, 'ship has no buildings');
        start();
    });
});

asyncTest('buildAt rotates item when can only be built rotated', function() {
    'use strict';
    th.restartGame(function() {
        var x, y, door;
        x = th.shipPositions.free.x;
        y = th.shipPositions.free.y;
        door = new DoorItem();
        ok(!door.canBuildAt(x, y), "Cannot build at x,y (there's no wall)");
        ok(!door.canBuildRotated(x, y), 'It cannot be built rotated either');

        ship.buildAt(x, y, 'wall');
        ship.buildAt(x, y + 1, 'wall');
        //update wall animations, important for door placement rules
        me.game.update();
        ok(!door.canBuildAt(x, y), 'After building vertical wall,' +
            'door still cannot be built at x,y...');
        ok(door.canBuildRotated(x, y), '... but it can rotated.');

        ship.buildAt(x, y, 'door');
        equal(ship.mapAt(x, y + 1).type, 'door',
            'mapAt(x, y+1) is door (it should be rotated, that is, vertical)');
        notEqual(ship.mapAt(x + 1, y).type, 'door',
            'mapAt(x+1,y) is not door');
        ok(ship.mapAt(x, y + 1).rotated(), "Door has 'rotated' status");
        start();
    });
});

asyncTest('mapAt out of bounds', function() {
    'use strict';
    th.onLevelReady(function() {
        ship.removeAll();
        strictEqual(ship.mapAt(-1, 0), null, 'mapAt(-1,0) is null');
        strictEqual(ship.mapAt(WIDTH, 0), null, 'mapAt(WIDTH,0) is null');
        strictEqual(ship.mapAt(0, HEIGHT), null, 'mapAt(0,HEIGHT) is null');
        start();
    });

});

asyncTest('fromJsonString', function() {
    'use strict';
    th.onLevelReady(function() {
        var power, door;
        ship.removeAll();
        ship.fromJsonString('[{"type":"power", "x":0, "y":0},' +
            ' {"type":"door", "x":2, "y":3, "rotated":true}]');

        power = ship.mapAt(0, 0);
        equal(power.type, 'power', 'power successfully added to the ship');
        equal(power.x(), 0, 'it has correct x position');
        equal(power.y(), 0, 'it has correct y position');
        ok(!power.rotated(), 'power is not rotated');

        door = ship.mapAt(2, 3);
        equal(door.type, 'door', 'door successfully added to the ship');
        equal(door.x(), 2, 'it has correct x position');
        equal(door.y(), 3, 'it has correct y position');
        ok(door.rotated(), 'door is rotated');

        equal(ship.buildings().length, 2, 'ship has 2 buildings added');
        start();
    });
});

asyncTest('fromJsonString clears buildings', function() {
    'use strict';
    th.onLevelReady(function() {
        ship.removeAll();
        ok(ship.buildAt(th.shipPositions.free.x, th.shipPositions.free.y,
            'power'), 'power successfully built');
        ok(ship.buildAt(th.shipPositions.engine.x, th.shipPositions.engine.y,
            'engine'), 'engine succesfully built');
        ship.fromJsonString('[{"type":"wall", "x":0, "y":0}]');
        equal(ship.buildings().length, 1,
            'ship has only one building after loading');
        equal(ship.buildings()[0].type, 'wall',
            'that only building is a wall (loaded through json)');

        ship.fromJsonString('[]');
        equal(ship.buildings().length, 0,
            'ship has 0 buildings after loading empty array');
        start();
    });

});

asyncTest('toJsonString', function() {
    'use strict';
    th.onLevelReady(function() {
        var jsonObject, power, engine;
        ship.removeAll();
        ok(ship.buildAt(th.shipPositions.free.x, th.shipPositions.free.y,
            'power'), 'power successfully built');
        ok(ship.buildAt(th.shipPositions.engine.x, th.shipPositions.engine.y,
            'engine'), 'engine succesfully built');
        ship.mapAt(th.shipPositions.engine.x, th.shipPositions.engine.y)
            .rotated(true);

        jsonObject = JSON.parse(ship.toJsonString());
        equal(jsonObject.length, 2, 'JSON object (array) has 2 objects');

        power = _.find(jsonObject, function(i) {
            return i.type === 'power';
        });
        equal(power.x, th.shipPositions.free.x,
            'power saved with correct x position');
        equal(power.y, th.shipPositions.free.y,
            'power saved with correct y position');
        ok(!power.rotated, 'power saved as not rotated');

        engine = _.find(jsonObject, function(i) {
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



module('main.js/ui');

asyncTest('choose', function() {
    'use strict';
    th.onLevelReady(function() {
        ui.choose('engine');
        equal(ui.chosen.type, 'engine');
        start();
    });
});

asyncTest('moveGhost', function() {
    'use strict';
    th.onLevelReady(function() {
        ui.choose('power');
        equal(ui.chosen.type, 'power');

        ui.moveGhost(12, 13);
        equal(ui.chosen.x(), 12);
        equal(ui.chosen.y(), 13);

        ui.moveGhost(4, 3);
        equal(ui.chosen.x(), 4);
        equal(ui.chosen.y(), 3);
        start();
    });
});

asyncTest('beginDrag/endDrag', function() {
    'use strict';
    th.onLevelReady(function() {
        var x, y, power;
        ship.removeAll();
        x = th.shipPositions.free.x;
        y = th.shipPositions.free.y;
        power = ship.buildAt(x, y, 'power');
        ok(power, 'power built');
        equal(power.x(), x, 'x before dragging');
        equal(power.y(), y, 'y before dragging');

        ui.beginDrag(power);
        equal(ui.chosen.type, 'power');
        equal(ui.dragging, power);
        th.mouseBegin();
        th.setMouse(x + 1, y);
        screen.mouseMove({});
        ui.endDrag();
        strictEqual(ui.dragging, null);
        strictEqual(ui.chosen, null);
        equal(power.x(), x + 1, 'x after dragging');
        equal(power.y(), y, 'y after dragging');
        th.mouseEnd();
        start();
    });
});

asyncTest('printRed/clearRed', function() {
    'use strict';
    th.onLevelReady(function() {
        var reds, redsInX4Y5;
        ui.clear();
        ui.printRed(4, 5);
        reds = me.game.getEntityByName('red');
        redsInX4Y5 = _.filter(reds, function(r) {
            return r.x() === 4 && r.y() === 5;
        }).length;
        ok(redsInX4Y5 > 0, 'There are red objects in the printed position');
        ui.clearRed();
        setTimeout(function() { //allow the game to refresh
            equal(me.game.getEntityByName('red').length, 0,
                'Red objects cleared');
            start();
        }, 100);
    });
});

asyncTest('rotate ghost when it could be built rotated', function() {
    'use strict';
    th.restartGame(function() {
        var hX, hY, hWall1, hWall2, door, vX, vY, vWall1, vWall2;
        hX = th.shipPositions.engine.x;
        hY = th.shipPositions.engine.y;
        hWall1 = ship.buildAt(hX, hY, 'wall');
        hWall2 = ship.buildAt(hX + 1, hY, 'wall');
        hWall1.update();
        hWall2.update(); //(for animations)
        door = utils.makeItem('door');
        ok(door.canBuildAt(hX, hY),
            'door can be built without rotation at horizontal wall');

        vX = th.shipPositions.free.x;
        vY = th.shipPositions.free.y;
        vWall1 = ship.buildAt(vX, vY, 'wall');
        vWall2 = ship.buildAt(vX, vY + 1, 'wall');
        vWall1.update();
        vWall2.update(); //(for animations)
        ok(door.canBuildRotated(vX, vY),
            'door can be built rotated at vertical wall');

        ui.choose('door');
        ok(!ui.chosen.rotated(),
            'Door ghost is not rotated when first chosen');

        ui.moveGhost(vX, vY);
        screen.mouseMove({});
        ok(ui.chosen.rotated(),
            'Door ghost has rotated when hovered over vertical wall');

        ui.moveGhost(hX, hY);
        screen.mouseMove({});
        ok(!ui.chosen.rotated(),
            'Door ghost back to not rotated when hovered over horizontal wall');
        start();
    });
});

asyncTest('draw/mapAt', function() {
    'use strict';
    th.restartGame(function() {
        ui.draw(4, 5, 'engine');
        var items = me.game.getEntityByName('item');
        ok(_.some(items, function(item) {
            return item.type === 'engine' && item.x() === 4 && item.y() === 5;
        }), 'Engine drawn at correct position');

        equal(ui.mapAt(4, 5).type, 'engine', 'mapAt(4,5) is engine');
        start();
    });
});

