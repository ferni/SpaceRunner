/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, asyncTest, test, ok, equal, notEqual, deepEqual, start, th,
me, utils, ui, ship, screen, TILE_SIZE*/

module('utils.js');
asyncTest('getParameterByName', function() {
    'use strict';
    th.restartGame(function() {
        equal(utils.getParameterByName('asdf'), null,
            "'asdf' not in query string");
        start();
    });
});

asyncTest('getQueriedShip: queried ship not found', function() {
    'use strict';
    th.restartGame(function() {
        var originalFunction = utils.getParameterByName;
        utils.getParameterByName = function() {
            return 'unknownShip';
        };
        equal(utils.getQueriedShip(), 'area_01',
            "'unknownShip' not found, returns default ship");
        utils.getParameterByName = originalFunction;
        start();
    });
});

asyncTest('getQueriedShip', function() {
    'use strict';
    th.restartGame(function() {
        var originalFunction = utils.getParameterByName;
        utils.getParameterByName = function() {
            return 'test';
        };
        equal(utils.getQueriedShip(), 'test');
        utils.getParameterByName = originalFunction;
        start();
    });
});

asyncTest('toTileVector', function() {
    'use strict';
    th.restartGame(function() {
        var tileVector = utils.toTileVector(new me.Vector2d(7, 7));
        equal(tileVector.x, 0);
        equal(tileVector.y, 0);

        tileVector = utils.toTileVector(new me.Vector2d(TILE_SIZE, TILE_SIZE));
        equal(tileVector.x, 1);
        equal(tileVector.y, 1);

        tileVector = utils.toTileVector(
            new me.Vector2d(TILE_SIZE - 1, TILE_SIZE));
        equal(tileVector.x, 0);
        equal(tileVector.y, 1);
        start();
    });
});

asyncTest('getEmptyMatrix', function() {
    'use strict';
    th.restartGame(function() {
        var matrix = utils.getEmptyMatrix(2, 3, 0);
        equal(matrix[0][0], 0);
        equal(matrix[0][1], 0);
        equal(matrix[1][0], 0);
        equal(matrix[1][1], 0);
        equal(matrix[2][0], 0);
        equal(matrix[2][1], 0);
        equal(matrix[0][2], undefined);
        equal(matrix[3], undefined);
        start();
    });
});

asyncTest('makeItem: invalid item', function() {
    'use strict';
    th.restartGame(function() {
        equal(utils.makeItem('asdf'), null);
        start();
    });
});

asyncTest('getMouse', function() {
    'use strict';
    th.restartGame(function() {
        var m = utils.getMouse();
        equal(m.x, 0);
        equal(m.y, 0);
        start();
    });
});

test('setCursor', function() {
    'use strict';
    utils.setCursor('move');
    equal(document.getElementById('jsapp').style.cursor, 'move',
        "Cursor set to 'move' in jsapp div");
});
