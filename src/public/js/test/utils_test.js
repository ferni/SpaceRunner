/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, asyncTest, test, ok, equal, notEqual, deepEqual, start, th,
me, utils, TILE_SIZE, sh, make*/

module('utils.js');
asyncTest('toTileVector', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    }, function() {
        var tileVector = utils.toTileVector(new me.Vector2d(7, 7));
        equal(tileVector.x, 0);
        equal(tileVector.y, 0);

        tileVector = utils.toTileVector(new me.Vector2d(TILE_SIZE, TILE_SIZE));
        equal(tileVector.x, 1);
        equal(tileVector.y, 1);

        tileVector = utils.toTileVector(
            new me.Vector2d(TILE_SIZE - 1, TILE_SIZE)
        );
        equal(tileVector.x, 0);
        equal(tileVector.y, 1);
        start();
    });

});

test('getEmptyMatrix', function() {
    'use strict';
    var matrix = sh.utils.getEmptyMatrix(2, 3, 0);
    equal(matrix[0][0], 0);
    equal(matrix[0][1], 0);
    equal(matrix[1][0], 0);
    equal(matrix[1][1], 0);
    equal(matrix[2][0], 0);
    equal(matrix[2][1], 0);
    equal(matrix[0][2], undefined);
    equal(matrix[3], undefined);
});

test('make.item: invalid item', function() {
    'use strict';
    equal(make.item('asdf'), null);
});

asyncTest('getMouse', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    }, function() {
        var originalPos = me.game.currentLevel.pos,
            m;
        me.game.currentLevel.pos = new me.Vector2d(0, 0);
        m = utils.getMouse();
        equal(m.x, 0);
        equal(m.y, 0);
        me.game.currentLevel.pos = originalPos;
        start();
    });

});

test('setCursor', function() {
    'use strict';
    utils.setCursor('move');
    equal(document.getElementById('jsapp').style.cursor, 'move',
        "Cursor set to 'move' in jsapp div");
});

test('windowsOverlap', function() {
    'use strict';
    ok(utils.windowsOverlap({from: 12, to: 18}, {from: 14, to: 16}));
    ok(utils.windowsOverlap({from: 12, to: 15}, {from: 14, to: 16}));
    ok(utils.windowsOverlap({from: 14, to: 16}, {from: 12, to: 18}));
    ok(utils.windowsOverlap({from: 12, to: 15}, {from: 10, to: 13}));
    ok(!utils.windowsOverlap({from: 12, to: 14}, {from: 14, to: 16}));
    ok(!utils.windowsOverlap({from: 14, to: 16}, {from: 12, to: 14}));
    ok(!utils.windowsOverlap({from: 12, to: 14}, {from: 15, to: 16}));
    ok(!utils.windowsOverlap({from: 15, to: 16}, {from: 12, to: 13}));
});

test('windowAdd', function() {
    'use strict';
    var addition = utils.windowAdd({from: 2, to: 5}, {from: 4, to: 10});
    equal(addition.from, 2);
    equal(addition.to, 10);

    addition = utils.windowAdd({from: 2, to: 4}, {from: 1, to: 10});
    equal(addition.from, 1);
    equal(addition.to, 10);

    addition = utils.windowAdd({from: 6, to: 14}, {from: 1, to: 10});
    equal(addition.from, 1);
    equal(addition.to, 14);
});
