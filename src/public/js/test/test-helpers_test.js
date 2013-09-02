/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, asyncTest, test, ok, equal, notEqual, deepEqual, start, th,
me, utils, FIRST_SCREEN, jsApp, strictEqual */

module('test_helpers.js');
asyncTest('onGameReady', function() {
    'use strict';
    th.onGameReady(function() {
        ok(FIRST_SCREEN, 'FIRST_SCREEN global is set');
        start();
    });
});

asyncTest('restartGame', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    },
        function() {
            ok(me.state.isCurrent('ship-building'));
            jsApp.loadReady = false;
            th.restartGame(function() {
                ok(jsApp.loadReady);
                start();
            });
        });

});

asyncTest('setMouse #1', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-select');
    },
        function(screen) {
            th.mouseBegin(screen);
            th.setMouse(4, 6);
            equal(utils.getMouse().x, 4, 'x');
            equal(utils.getMouse().y, 6, 'y');
            th.mouseEnd();
            start();
        });
});

asyncTest('setMouse (test ship)', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    },
        function(screen) {
            th.mouseBegin(screen);
            th.setMouse(4, 6);
            equal(utils.getMouse().x, 4, 'x');
            equal(utils.getMouse().y, 6, 'y');
            th.mouseEnd();
            start();
        });
});

asyncTest('setMouse (cyborg_battleship1)', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'cyborg_battleship1'});
    },
        function(screen) {
            th.mouseBegin(screen);
            th.setMouse(4, 6);
            equal(utils.getMouse().x, 4, 'x');
            equal(utils.getMouse().y, 6, 'y');
            th.mouseEnd();
            start();
        });
});

asyncTest('loadScreen #1', function() {
    'use strict';
    th.restartGame(function() {
        th.loadScreen(function() {
            me.state.change('ship-building', {tmxName: 'test'});
        }, function(screen) {
            ok(me.state.current().isReset);
            ok(me.state.isCurrent('ship-building'));
            ok(screen.isReset);
            strictEqual(me.state.current(), screen);
            start();
        });
    });
});

asyncTest('loadScreen back and forth', function() {
    'use strict';
    th.loadScreen(function() {
        me.state.change('ship-building', {tmxName: 'test'});
    }, function(screen) {
        ok(me.state.current().isReset);
        ok(me.state.isCurrent('ship-building'));
        ok(screen.isReset);
        strictEqual(me.state.current(), screen);

        th.loadScreen(function() {
            me.state.change('ship-select');
        }, function(screen2) {
            ok(!screen.isReset);
            ok(me.state.current().isReset);
            ok(me.state.isCurrent('ship-select'));
            ok(screen2.isReset);
            strictEqual(me.state.current(), screen2);

            th.loadScreen(function() {
                me.state.change('ship-building', {tmxName: 'test'});
            }, function(screen3) {
                ok(!screen2.isReset);
                ok(me.state.current().isReset);
                ok(me.state.isCurrent('ship-building'));
                ok(screen3.isReset);
                strictEqual(me.state.current(), screen3);
                start();
            });

        });

    });
});

