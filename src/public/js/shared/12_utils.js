/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

var sh = require('./10_general-stuff'), _ = sh._;
if(typeof exports !== 'undefined'){
    sh = module.exports = sh;
}

sh.utils = {};

sh.utils.getEmptyMatrix = function(width, height, initialValue) {
    'use strict';
    var matrix = [], i, j;
    for (i = 0; i < height; i++) {
        matrix.push([]);
        for (j = 0; j < width; j++) {
            matrix[i].push(initialValue);
        }
    }
    return matrix;
};

//useful when wanting to do something at every coordinate of a matrix
sh.utils.matrixTiles = function(width, height, callback) { // callback(x, y)
    'use strict';
    var x, y;
    for (x = 0; x < width; x++) {
        for (y = 0; y < height; y++) {
            callback(x, y);
        }
    }
};
