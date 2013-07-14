/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

var hullMapGenerator = {
    getCollisionTileChar: function(tmxMap, x, y) {
        'use strict';
        var tileLayer, tileId, tileSet, tilePro;
        tileLayer = tmxMap.getLayerByName('collision');
        tileId = tileLayer.getTileId(x + 1, y + 1);
        if (tileId === null) {
            return sh.tiles.clear;
        }
        tileSet = tileLayer.tilesets.getTilesetByGid(tileId);
        tilePro = tileSet.getTileProperties(tileId);
        if (tilePro.isSolid) {
            return sh.tiles.solid;
        }
        if (tilePro.isPlatform) {
            return sh.tiles.back;
        }
        if (tilePro.isLeftSlope) {
            return sh.tiles.front;
        }
        if (tilePro.isRightSlope) {
            return sh.tiles.front;
        }
    },
    get: function(tmxMap) {
        'use strict';
        var map, tileWidth, tileHeight, y, x, pixelPos, row;
        tileWidth = tmxMap.tilewidth;
        tileHeight = tmxMap.tileheight;
        pixelPos = {
            x: tileWidth / 2,
            y: tileHeight / 2
        };
        map = [];
        for (y = 0; y < tmxMap.height; y++) {
            row = [];
            pixelPos.x = tileWidth / 2;
            for (x = 0; x < tmxMap.width; x++) {
                row.push(this.getCollisionTileChar(tmxMap,
                    pixelPos.x, pixelPos.y));
                pixelPos.x += tileWidth;
            }
            map.push('');
            map[y] = row.join('');
            pixelPos.y += tileHeight;
        }
        return {
            width: tmxMap.width,
            height: tmxMap.height,
            map: map
        };
    }
};

