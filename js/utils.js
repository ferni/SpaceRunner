﻿// Avoid `console` errors in browsers that lack a console.
if (!(window.console && console.log)) {
    (function () {
        var noop = function () { };
        var methods = ['assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error', 'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log', 'markTimeline', 'profile', 'profileEnd', 'markTimeline', 'table', 'time', 'timeEnd', 'timeStamp', 'trace', 'warn'];
        var length = methods.length;
        var console = window.console = {};
        while (length--) {
            console[methods[length]] = noop;
        }
    } ());
}


var utils = {
    getParameterByName: function (name) {
        var match = RegExp('[?&]' + name + '=([^&]*)')
                        .exec(window.location.search);
        return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
    },
    //For loading different ships by adding ship=<name> in the query string.
    getQueriedShip: function () {
        var defaultShip = "area_01";
        var ship = utils.getParameterByName("ship");
        if (ship === null) return defaultShip;
        for (var i = 0; i < g_resources.length; i++) {
            if (g_resources[i].name == ship && g_resources[i].type == "tmx") {
                return ship;
            }
        }
        console.log("Ship \"" + ship + "\" doesn't exist. Loading \"" + defaultShip + "\" instead.");
        return defaultShip;
    },
    toTileVector: function (vector2D) {
        var v = new me.Vector2d();
        v.x = Math.floor(vector2D.x / me.game.currentLevel.tilewidth);
        v.y = Math.floor(vector2D.y / me.game.currentLevel.tileheight);
        return v;
    },
    //useful when wanting to do something at every coordinate of a matrix
    matrixTiles: function (width, height, callback) {//the callback must have x and y
        for (var x = 0; x < width; x++) {
            for (var y = 0; y < height; y++) {
                callback(x, y);
            }
        }
    },
    //useful when wanting to do something at every coordinate of the level
    levelTiles: function (callback) {//the callback must have x and y
        utils.matrixTiles(WIDTH, HEIGHT, callback);
    },
    //traverses every tile coordinate inside the level of an item
    itemTiles: function (item, callback) {//the callback must have x and y
        if (!item) return;
        for (var x = item.x(); x < item.trueSize(0) + item.x() && x < WIDTH && x >= 0; x++) {
            for (var y = item.y(); y < item.trueSize(1) + item.y() && y < HEIGHT && y >= 0; y++) {
                callback(x, y);
            }
        }
    },
    getEmptyMatrix: function (width, height, initialValue) {
        var matrix = new Array();
        for (var i = 0; i < height; i++) {
            matrix.push(new Array());
            for (var j = 0; j < width; j++) {
                matrix[i].push(initialValue);
            }
        }
        return matrix;
    },
    makeItem: function (type) {
        var itemConstructor = items[type];
        if (!itemConstructor) {
            console.error("No such item type '" + type + "' (utils.makeItem).");
            return null;
        }
        return new itemConstructor(-100, -100, {});
    },
    //returns the tile position of the mouse
    getMouse: function () {
        return utils.toTileVector(me.input.mouse.pos);
    }
};