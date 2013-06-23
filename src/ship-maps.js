/*
 -*- coding: utf-8 -*-
 * vim: set ts=4 sw=4 et sts=4 ai:
 * Copyright 2013 MITHIS
 * All rights reserved.
 */

var shared = require('./public/js/shared'),
    fs = require('fs'),
    tmx = require('tmx'),
    mapNames = [
        'cyborg_battleship1',
        'cyborg_cruiser',
        'cyborg_drone',
        'cyborg_frigate',
        'humanoid_battleship',
        'humanoid_cruiser',
        'humanoid_drone',
        'humanoid_frigate',
        'liquid_battleship',
        'liquid_cruiser',
        'liquid_drone',
        'liquid_frigate',
        'mechanoid_battleship',
        'mechanoid_cruiser',
        'mechanoid_drone',
        'mechanoid_frigate'
    ];


function getPath(mapName){
    return __dirname + '/public/data/outlines/' + mapName + '.tmx';
}

function loadMap(maps, index, end) {
    var file, parser,
        mapName;
    mapName = mapNames[index];
    file = fs.createReadStream(getPath(mapName));
    parser = tmx.createParser();
    parser.on('data', function(buffer){
        maps[mapName] = JSON.parse(buffer.toString());
        if(index < mapNames.length - 1) {
            loadMap(maps, index + 1, end);
        } else{
            end(maps);
        }
    });
    file.pipe(parser);
}

//loads the maps one by one
exports.loadMaps = function (callback) {
   loadMap({}, 0, callback);
};
