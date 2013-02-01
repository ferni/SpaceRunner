/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, utils, screen, th, jsApp*/

var th = {
    shipPositions: {
        free: {
            x: 4,
            y: 4
        },
        engine: {
            x: 3,
            y: 1
        },
        weapon: {
            x: 5,
            y: 2
        },
        solid: {
            x: 13,
            y: 1
        }
    },
    //Calls the callback when the state is "PLAY"
    onLevelReady: function(callback) {
        'use strict';
        var interval = setInterval(function() {
            if (me.state.isCurrent(me.state.PLAY)) {
                callback();
                clearInterval(interval);
            }
        }, 100);
    },
    restartGame: function(callback) {
        'use strict';
        try {
            me.state.change(me.state.PLAY);
        } catch (e) {}
        th.onLevelReady(function() {
            me.state.change(me.state.GAMEOVER);
            jsApp.loaded('test');
            th.onLevelReady(callback);
        });
    },
    _originalGetMouseFunction: utils.getMouse,
    _mousePosition: {
        x: 1,
        y: 1
    },
    mouseBegin: function() {
        'use strict';
        //replace utils.getMouse function
        utils.getMouse = function() {
            var vector = new me.Vector2d();
            vector.x = th._mousePosition.x;
            vector.y = th._mousePosition.y;
            return vector;
        };
    },
    mouseEnd: function() {
        'use strict';
        utils.getMouse = this._originalGetMouseFunction;
    },
    //fakes the mouse position (x: tile column, y: tile row)
    setMouse: function(x, y) {
        'use strict';
        this._mousePosition.x = x;
        this._mousePosition.y = y;
    },
    moveMouse: function(x, y) {
        'use strict';
        this.setMouse(x, y);
        screen.mouseMove({});
    },
    clickMouse: function(which, x, y) {
        'use strict';
        if (x !== undefined && y !== undefined) {
            this.moveMouse(x, y);
        }
        screen.mouseDown({
            which: which
        });
        screen.mouseUp({
            which: which
        });
    },
    leftClick: function(x, y) {
        'use strict';
        this.clickMouse(me.input.mouse.LEFT, x, y);
    },
    rightClick: function(x, y) {
        'use strict';
        this.clickMouse(me.input.mouse.RIGHT, x, y);
    }
};

/*
 --- Clean test template ---

    asyncTest("test name", function () {
        th.restartGame(function () {
            //test here
            start();
        });
    });
*/

