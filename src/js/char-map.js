/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me*/
var charMap = {
    codes: {
        _solid: 's',
        _front: 'f',
        _back: 'b',
        _cleared: '.'
    },
    getCollisionTileChar: function(x, y) {
        'use strict';
        var tileLayer, tileId, tileSet, tilePro;
        tileLayer = me.game.currentLevel.getLayerByName('collision');
        tileId = tileLayer.getTileId(x + 1, y + 1);
        if (tileId === null) {
            return charMap.codes._cleared;
        }
        tileSet = tileLayer.tilesets.getTilesetByGid(tileId);
        tilePro = tileSet.getTileProperties(tileId);
        if (tilePro.isSolid) {
            return charMap.codes._solid;
        }
        if (tilePro.isPlatform) {
            return charMap.codes._back;
        }
        if (tilePro.isLeftSlope) {
            return charMap.codes._front;
        }
        if (tilePro.isRightSlope) {
            return charMap.codes._front;
        }
    },
    get: function() {
        'use strict';
        var map, tileWidth, tileHeight, y, x, pixelPos, row;
        tileWidth = me.game.currentLevel.tilewidth;
        tileHeight = me.game.currentLevel.tileheight;
        pixelPos = {
            x: tileWidth / 2,
            y: tileHeight / 2
        };
        map = [];
        for (y = 0; y < me.game.currentLevel.height; y++) {
            row = [];
            pixelPos.x = tileWidth / 2;
            for (x = 0; x < me.game.currentLevel.width; x++) {
                row.push(this.getCollisionTileChar(pixelPos.x, pixelPos.y));
                pixelPos.x += tileWidth;
            }
            map.push('');
            map[y] = row.join('');
            pixelPos.y += tileHeight;
        }
        return map;
    }
};

