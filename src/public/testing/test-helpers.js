/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, utils, th, jsApp, FIRST_SCREEN, sh*/

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
    onGameReady: function(callback) {
        'use strict';
        if (jsApp.loadReady) {
            callback();
            return;
        }
        jsApp.onAppLoaded = function() {
            jsApp.onAppLoaded = function() { };
            callback();
        };
    },
    restartGame: function(callback) {
        'use strict';
        me.state.change(me.state.GAMEOVER);
        jsApp.onAppLoaded = function() {
            jsApp.onAppLoaded = function() { };
            th.onState(FIRST_SCREEN, callback);
        };
        jsApp.loaded();
    },
    onState: function(state, callback) {
        'use strict';
        var interval = setInterval(function() {
            if (me.state.isCurrent(state)) {
                callback();
                clearInterval(interval);
            }
        }, 100);
    },
    loadScreen: function(changeState, onReady) {
        'use strict';
        jsApp.onScreenReset = function() {
            jsApp.onScreenReset = function() { };
            onReady(me.state.current());
        };
        changeState();
    },
    _originalGetMouseFunction: utils.getMouse,
    _mousePosition: {
        x: 1,
        y: 1
    },
    _screen: null,
    mouseBegin: function(screen) {
        'use strict';
        if (!screen) {
            throw 'screen parameter is mandatory';
        }
        this._screen = screen;
        //replace utils.getMouse function
        utils.getMouse = function() {
            return {
                x: th._mousePosition.x,
                y: th._mousePosition.y
            };
        };
    },
    mouseEnd: function() {
        'use strict';
        utils.getMouse = this._originalGetMouseFunction;
        this._screen = null;
    },
    //fakes the mouse position (x: tile column, y: tile row)
    setMouse: function(x, y) {
        'use strict';
        if (!this._screen) {
            throw 'Call th.mouseBegin before calling th.setMouse';
        }
        this._mousePosition.x = x;
        this._mousePosition.y = y;
    },
    moveMouse: function(x, y) {
        'use strict';
        if (!this._screen) {
            throw 'Call th.mouseBegin before calling th.mouseMove';
        }
        this.setMouse(x, y);
        this._screen.mouseMove({});
    },
    clickMouse: function(which, x, y) {
        'use strict';
        if (!this._screen) {
            throw 'Call th.mouseBegin before calling th.clickMouse';
        }
        if (x !== undefined && y !== undefined) {
            this.moveMouse(x, y);
        }
        this._screen.mouseDown({
            which: which + 1 //taking into account the adjustment made inside
        });
        this._screen.mouseUp({
            which: which + 1 //taking into account the adjustment made inside
        });
    },
    leftClick: function(x, y) {
        'use strict';
        if (!this._screen) {
            throw 'Call th.mouseBegin before calling th.leftClick';
        }
        this.clickMouse(me.input.mouse.LEFT, x, y);
    },
    rightClick: function(x, y) {
        'use strict';
        if (!this._screen) {
            throw 'Call th.mouseBegin before calling th.rightClick';
        }
        this.clickMouse(me.input.mouse.RIGHT, x, y);
    },
    /**
     * multiplies the value by sh.GRID_SUB
     * @param {int} value
     * @return {int}
     */
    s: function(value) {
        'use strict';
        return value * sh.GRID_SUB;
    }
};

/*
 --- Clean test template ---

    asyncTest("test name", function() {
        th.restartGame(function() {
            //test here
            start();
        });
    });
*/

