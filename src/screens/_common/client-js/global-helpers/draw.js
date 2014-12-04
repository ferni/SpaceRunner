/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module*/

var gs = require('../game-state'),
    TILE_SIZE = gs.TILE_SIZE,
    HALF_TILE = gs.HALF_TILE;

/**
 * Draws stuff on the canvas based on canvas' primitives
 * @type {{}}
 */
var draw = module.exports = (function() {
    'use strict';
    var lineDashOffset = 1000;
    setInterval(function() {
        lineDashOffset--;
        if (lineDashOffset === 0) {
            lineDashOffset = 1000;
        }
    }, 64);
    return {
        tileHighlight: function(ctx, pos, color, thickness) {
            var pixelPos = {x: pos.x * TILE_SIZE,
                y: pos.y * TILE_SIZE};
            ctx.strokeStyle = color;
            ctx.lineWidth = thickness;
            ctx.moveTo(pixelPos.x, pixelPos.y);
            ctx.strokeRect(pixelPos.x, pixelPos.y, TILE_SIZE, TILE_SIZE);
        },
        circle: function(ctx, position, size, color) {
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.arc((position.x * TILE_SIZE) + HALF_TILE,
                (position.y * TILE_SIZE) + HALF_TILE,
                size, 0, Math.PI * 2, false);
            ctx.fill();
        },
        line: function(ctx, from, to, color, thickness) {
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = thickness;
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
        },
        getLineDashOffset: function() {
            return lineDashOffset;
        }
    };
}());
