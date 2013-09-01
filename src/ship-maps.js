/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, __dirname, exports*/

var sh = require('./public/js/shared'),
    fs = require('fs'),
    tmx = require('tmx');


function getPath(mapName) {
    'use strict';
    return __dirname + '/public/data/outlines/' + mapName + '.tmx';
}

function getCollisionTileChar(tileId) {
    'use strict';
    switch (tileId) {
    case 0:
        return sh.tiles.clear;
    case 1:
        return sh.tiles.solid;
    case 2:
        return sh.tiles.back;
    case 3:
    case 4:
        return sh.tiles.front;
    default:
        return '?';
    }
}

/**
 * Converts the map given by tmx package to map with a 2d array of
 * sh.tiles . The map.hull should be identical to the one
 * returned on the client on hullMap.get(TMXTileMap)
 * @param {*} tmxMap Map generated by tmx.
 * @param {String} mapName The map name.
 * @return {{width: (int), height: (int), map: Array}}
 */
function toMapWithHull(tmxMap, mapName) {
    'use strict';
    var colLayer = tmxMap.layers[2].data,
        y,
        x,
        hull = [],
        row,
        i = 0;
    if (tmxMap.layers[2].name !== 'collision') {
        throw 'Collision layer name should be "collision" instead of "' +
            colLayer.name + '". (' + mapName + ')';
    }
    for (y = 0; y < tmxMap.height; y++) {
        row = [];
        for (x = 0; x < tmxMap.width; x++, i++) {
            row.push(getCollisionTileChar(colLayer[i]));
        }
        hull.push('');
        hull[y] = row.join('');
    }
    return {
        width: parseInt(tmxMap.width, 10),
        height: parseInt(tmxMap.height, 10),
        map: hull
    };
}

function loadMap(maps, index, end) {
    'use strict';
    var file, parser,
        mapName;
    mapName = sh.mapNames[index];
    file = fs.createReadStream(getPath(mapName));
    parser = tmx.createParser();
    parser.on('data', function(buffer) {
        maps[mapName] = JSON.parse(buffer.toString());
        maps[mapName] = toMapWithHull(maps[mapName], mapName);
        if (index < sh.mapNames.length - 1) {
            loadMap(maps, index + 1, end);
        } else {
            end(maps);
        }
    });
    file.pipe(parser);
}

/**
 * Loads all the maps.
 * @param {Function} callback Callback when finished.
 */
exports.loadMaps = function(callback) {
    'use strict';
    loadMap({}, 0, callback);
};
