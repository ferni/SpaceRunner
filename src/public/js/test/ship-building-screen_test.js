/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global
_, th, asyncTest, equal, ok, me, notEqual, strictEqual, start,
utils, module */

module('ship-building.js');

asyncTest('ESC key un-chooses the item', function() {
    'use strict';
    th.restartGame(function() {
        th.loadScreen(function() {
            me.state.change('ship-building', {tmxName: 'test'});
        }, function(screen) {
            screen.choose('power');
            ok(screen.chosen, 'something chosen');
            me.input.triggerKeyEvent(me.input.KEY.ESC, true);
            screen.update();
            me.input.triggerKeyEvent(me.input.KEY.ESC, false);
            ok(!screen.chosen, 'Nothing is chosen after hitting escape');
            start();
        });
    });
});

asyncTest('mouseDbClick does not give an error when mouse is not locked',
    function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    }, function(screen) {
        equal(screen.mouseLockedOn, null, 'Mouse is not locked');
        screen.mouseDbClick({
            which: me.input.mouse.LEFT
        });
        start();
    });
});

asyncTest('right click removes item', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    }, function(screen) {
        var x = th.shipPositions.free.x,
            y = th.shipPositions.free.y;
        screen.ship.buildAt(x, y, 'component');
        equal(screen.ship.mapAt(x, y).type, 'component', 'Component built');
        th.mouseBegin(screen);
        th.rightClick(x + 1, y + 1); //botton right of component
        th.mouseEnd();
        notEqual(screen.ship.mapAt(x, y).type, 'component',
            'Component removed');
        start();
    });
});

asyncTest('drag and drop', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    }, function(screen) {
        var power;
        ok(screen.ship.buildAt(3, 4, 'power'), 'power succesfully built');
        th.mouseBegin(screen);
        th.moveMouse(3, 4);
        screen.mouseDown({
            which: me.input.mouse.LEFT
        });
        equal(screen.dragging.type, 'power', 'power being dragged');

        th.moveMouse(5, 4);
        screen.mouseUp({
            which: me.input.mouse.LEFT
        });
        ok(!screen.dragging, 'not dragging after mouse up');
        notEqual(screen.ship.mapAt(3, 4).type, 'power',
            'power is not on original position');
        power = screen.ship.mapAt(5, 4);
        equal(power.x, 5, 'power is at new position');
        th.mouseEnd();
        start();
    });
});

asyncTest('choose', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    }, function(screen) {
        screen.choose('engine');
        equal(screen.chosen.type, 'engine');
        start();
    });
});

asyncTest('moveGhost', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    }, function(screen) {
        screen.choose('power');
        equal(screen.chosen.type, 'power');

        screen.moveGhost(12, 13);
        equal(screen.chosen.x, 12);
        equal(screen.chosen.y, 13);

        screen.moveGhost(4, 3);
        equal(screen.chosen.x, 4);
        equal(screen.chosen.y, 3);
        start();
    });
});

asyncTest('beginDrag/endDrag', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    }, function(screen) {
        var x, y, power;
        screen.ship.removeAll();
        x = th.shipPositions.free.x;
        y = th.shipPositions.free.y;
        power = screen.ship.buildAt(x, y, 'power');
        ok(power, 'power built');
        equal(power.x, x, 'x before dragging');
        equal(power.y, y, 'y before dragging');

        screen.beginDrag(power);
        equal(screen.chosen.type, 'power');
        equal(screen.dragging, power);
        th.mouseBegin(screen);
        th.setMouse(x + 1, y);
        screen.mouseMove({});
        screen.endDrag();
        strictEqual(screen.dragging, null);
        strictEqual(screen.chosen, null);
        equal(power.x, x + 1, 'x after dragging');
        equal(power.y, y, 'y after dragging');
        th.mouseEnd();
        start();
    });
});

asyncTest('printRed/clearRed', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    }, function(screen) {
        var reds, redsInX4Y5;
        screen.clear();
        screen.printRed(4, 5);
        reds = me.game.getEntityByName('red');
        redsInX4Y5 = _.filter(reds, function(r) {
            return r.x === 4 && r.y === 5;
        }).length;
        ok(redsInX4Y5 > 0, 'There are red objects in the printed position');
        screen.clearRed();
        setTimeout(function() { //allow the game to refresh
            equal(me.game.getEntityByName('red').length, 0,
                'Red objects cleared');
            start();
        }, 100);
    });
});

asyncTest('rotate ghost when it could be built rotated', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    }, function(screen) {
        var hX, hY, door, vX, vY;
        hX = th.shipPositions.engine.x;
        hY = th.shipPositions.engine.y;
        screen.ship.buildAt(hX, hY, 'wall');
         screen.ship.buildAt(hX + 1, hY, 'wall');
        screen.mouseLockedOn = null;
        door = make.itemModel('door');
        ok(door.canBuildAt(hX, hY, screen.ship),
            'door can be built without rotation at horizontal wall');

        vX = th.shipPositions.free.x;
        vY = th.shipPositions.free.y;
        screen.ship.buildAt(vX, vY, 'wall');
        screen.ship.buildAt(vX, vY + 1, 'wall');
        screen.mouseLockedOn = null;
        ok(door.canBuildRotated(vX, vY, screen.ship),
            'door can be built rotated at vertical wall');

        screen.choose('door');
        ok(!screen.chosen.rotated(),
            'Door ghost is not rotated when first chosen');

        screen.moveGhost(vX, vY);
        screen.mouseMove({});
        ok(screen.chosen.rotated(),
            'Door ghost has rotated when hovered over vertical wall');

        screen.moveGhost(hX, hY);
        screen.mouseMove({});
        ok(!screen.chosen.rotated(),
            'Door ghost back to not rotated when hovered over horizontal wall');
        start();
    });
});

asyncTest('draw/mapAt', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    }, function(screen) {
        var items;
        screen.drawItem(4, 5, 'engine');
        items = screen.drawingScreen;
        ok(_.some(items, function(item) {
            return item.type === 'engine' && item.x === 4 && item.y === 5;
        }), 'Engine drawn at correct position');

        equal(screen.mapAt(4, 5).type, 'engine', 'mapAt(4,5) is engine');
        start();
    });
});

asyncTest('updateShip', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    }, function(screen) {
        var ship = screen.ship, aux,
            engine = new sh.items.Engine(),
            weapon = new sh.items.Weapon();
        screen.updateShip();
        equal(screen.shipItemVMs.length, 0, 'No vms yet');
        ship.add(engine);
        screen.updateShip();
        equal(screen.shipItemVMs.length, 1, 'A vm added...');
        equal(screen.shipItemVMs[0].m, engine, "... it's the engine.");
        ship.add(weapon);
        screen.updateShip();
        equal(screen.shipItemVMs.length, 2, 'Another vm added...');
        equal(screen.shipItemVMs[1].m, weapon, "... it's the weapon.");
        aux = ship._buildings[0];
        ship._buildings[0] = ship._buildings[1];
        ship._buildings[1] = aux;
        screen.updateShip();
        equal(screen.shipItemVMs.length, 2, 'Length remains the same...');
        equal(screen.shipItemVMs[0].m, weapon, '...but VMs switched positions.');
        ship.remove(weapon, true);
        screen.updateShip();
        equal(screen.shipItemVMs.length, 1, 'VM removed...');
        equal(screen.shipItemVMs[0].m, engine, "... the engine remains.");

        start();
    });
});
