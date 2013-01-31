/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, _, WIDTH, HEIGHT, g_resources, items*/
// Avoid `console` errors in browsers that lack a console.
if (!(window.console && console.log)) {
    (function() {
        'use strict';
        var noop, methods, length, console;
        noop = function() {};
        methods = ['assert', 'clear', 'count', 'debug', 'dir', 'dirxml',
            'error', 'exception', 'group', 'groupCollapsed', 'groupEnd',
            'info', 'log', 'markTimeline', 'profile', 'profileEnd',
            'markTimeline', 'table', 'time', 'timeEnd', 'timeStamp', 'trace',
            'warn'];
        length = methods.length;
        console = window.console = {};
        while (length--) {
            console[methods[length]] = noop;
        }
    }());
}

var utils = {
    getParameterByName: function(name) {
        'use strict';
        var match = new RegExp('[?&]' + name + '=([^&]*)')
            .exec(window.location.search);
        return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
    },
    //For loading different ships by adding ship=<name> in the query string.
    getQueriedShip: function() {
        'use strict';
        var defaultShip, ship, i;
        defaultShip = 'area_01';
        ship = utils.getParameterByName('ship');
        if (ship === null) {
            return defaultShip;
        }
        for (i = 0; i < g_resources.length; i++) {
            if (g_resources[i].name === ship &&
                g_resources[i].type === 'tmx') {
                return ship;
            }
        }
        console.log('Ship "' + ship + '" doesn\'t exist. Loading "' +
            defaultShip + '" instead.');
        return defaultShip;
    },
    toTileVector: function(vector2D) {
        'use strict';
        var v = new me.Vector2d();
        v.x = Math.floor(vector2D.x / me.game.currentLevel.tilewidth);
        v.y = Math.floor(vector2D.y / me.game.currentLevel.tileheight);
        return v;
    },
    //useful when wanting to do something at every coordinate of a matrix
    matrixTiles: function(width, height, callback) { // callback(x, y)
        'use strict';
        var x, y;
        for (x = 0; x < width; x++) {
            for (y = 0; y < height; y++) {
                callback(x, y);
            }
        }
    },
    //useful when wanting to do something at every coordinate of the level
    levelTiles: function(callback) { //the callback must have x and y
        'use strict';
        utils.matrixTiles(WIDTH, HEIGHT, callback);
    },
    //traverses every tile coordinate inside the level of an item
    itemTiles: function(item, callback) { //the callback must have x and y
        'use strict';
        var x, y;
        if (!item) {
            return;
        }
        for (x = item.x(); x < item.trueSize(0) + item.x() &&
            x < WIDTH && x >= 0; x++) {
            for (y = item.y(); y < item.trueSize(1) + item.y() &&
                y < HEIGHT && y >= 0; y++) {
                callback(x, y);
            }
        }
    },
    getEmptyMatrix: function(width, height, initialValue) {
        'use strict';
        var matrix = [], i, j;
        for (i = 0; i < height; i++) {
            matrix.push([]);
            for (j = 0; j < width; j++) {
                matrix[i].push(initialValue);
            }
        }
        return matrix;
    },
    makeItem: function(type) {
        'use strict';
        var Constructor = items[type];
        if (!Constructor) {
            console.warn("No such item type '" + type +
                "' (utils.makeItem)");
            return null;
        }
        return new Constructor(-100, -100, {});
    },
    //returns the tile position of the mouse
    getMouse: function() {
        'use strict';
        return utils.toTileVector(me.input.mouse.pos);
    },
    setCursor: function(cursor) {
        'use strict';
        document.getElementById('jsapp').style.cursor = cursor;
    }
};

