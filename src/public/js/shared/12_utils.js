/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module*/

var sh = require('./10_general-stuff'), _ = sh._;
if (typeof exports !== 'undefined') {
    /**
     * exports from NodeJS
     * @type {*}
     */
    sh = module.exports = sh;
}

/**
 * Utilities
 * @type {{getEmptyMatrix: Function, matrixTiles: Function}}
 * @return {null}
 */
sh.utils = {
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
    convertPosition: function(pos, fromGridSub, toGridSub) {
        'use strict';
        pos.x = pos.x * (toGridSub / fromGridSub);
        pos.y = pos.y * (toGridSub / fromGridSub);
    },
    mapToJson: function(arrayOfObjects) {
        'use strict';
        return _.map(arrayOfObjects, function(o) {
            return o.toJson();
        });
    },
    mapFromJson: function(arrayOfJsons, constructorCollection) {
        'use strict';
        return _.map(arrayOfJsons, function(json) {
            return new constructorCollection[json.type](json);
        });
    },
    removeFromArray: function(item, array) {
        'use strict';
        var index = array.indexOf(item);
        if (index > -1) {
            array.splice(index, 1);
        }
    }
};

