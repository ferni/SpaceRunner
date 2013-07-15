/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, _, g_resources, items, width, height, TILE_SIZE */

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
    toTileVector: function(vector2D) {
        'use strict';
        var v = new me.Vector2d();
        v.x = Math.floor(vector2D.x / TILE_SIZE);
        v.y = Math.floor(vector2D.y / TILE_SIZE);
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
        utils.matrixTiles(me.game.currentLevel.width,
            me.game.currentLevel.height, callback);
    },
    //returns the tile position of the mouse
    getMouse: function(exact) {
        'use strict';
        if (!me.game.currentLevel.initialized) {
            throw "There's no level to get the mouse";
        }
        var relPosition = this.vectorSub(me.input.mouse.pos,
            me.game.currentLevel.pos);
        return exact ? relPosition : utils.toTileVector(relPosition);
    },
    setCursor: function(cursor) {
        'use strict';
        document.getElementById('jsapp').style.cursor = cursor;
    },
    vectorSub: function(v1, v2) {
        'use strict';
        return { x: v1.x - v2.x, y: v1.y - v2.y };
    },
    boolToInt: function(boole){
        'use strict';
        return boole ? 1 : 0;
    },
    pathToPixels: function(path) {
        'use strict';
        var newPath = [], i;
        for (i = 0; i < path.length; i++) {
            newPath.push([(path[i][0] * TILE_SIZE) + HALF_TILE,
                (path[i][1] * TILE_SIZE) + HALF_TILE]);
        }
        return newPath;
    },
    /**
     * Executes a callback when a certain number of
     * .done() were called on TaskWait, or an
     * error handler if .error() was called instead.
     * @param settings {Object} has 'pendingCount'(int), 'success', 'error'.
     * @constructor
     */
    TaskWait: function(settings){
        var tickCount = 0,
            errorThrown = false,
            pendingCount = settings.pendingCount,
            _allDoneCallback = settings.allDone,
            _errorCallback = settings.error;

        this.done = function(){
            if(errorThrown){
                return;
            }
            tickCount++;
            if(tickCount === pendingCount){
                _allDoneCallback();
            }else if(tickCount > pendingCount){
                throw 'Number of ticks exceeded expected count ' +
                    '(pendingCount).';
            }
        };
        this.error = function(){
            errorThrown = true;
            _errorCallback();
        }
    },
    windowsOverlap: function(w1, w2) {
        'use strict';
        if(w1.to < w1.from || w2.to < w2.from ) {
            throw 'Argument not a valid window (to < than from)';
        }
        return w1.from < w2.to && w1.to > w2.from
            || w2.from < w1.to && w2.to > w1.from;
    },
    windowAdd: function(w1, w2) {
        'use strict';
        if(w1.to < w1.from || w2.to < w2.from ) {
            throw 'Argument not a valid window (to < than from)';
        }
        if(!utils.windowsOverlap(w1, w2)) {
            throw 'Can only add overlapping windows.';
        }
        return {from: w1.from < w2.from ? w1.from : w2.from,
                to: w1.to > w2.to ? w1.to : w2.to};
    },
    /**
     * Returns the model of the object if it's a viewmodel,
     * or returns the object itself if it's a model.
     * @param object
     */
    getModel: function(object) {
        if(object instanceof sh.Item) {
            return object;
        }
        if(object instanceof ItemEntity){
            return object.m;
        }
    },
    /**
     * Finds an item viewmodel associated with the item model.
     * @param model {sh.items.Item} the model.
     * @returns {*}
     */
    findVM: function(model) {
        //TODO: make an index
        var vm = _.find(me.game.getEntityByName('item'), function(item) {
            return item.m === model;
        });
        if (!vm) {
            console.warn('Could not find vm of ' + model.type);
        }
        return vm;
    }

};

