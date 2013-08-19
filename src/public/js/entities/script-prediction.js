/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global */

/**
 * Displays the script on the screen.
 * @type {*}
 */
var ScriptPrediction = Object.extend({
    init: function(model){
        this.m = model;
    },
    drawLines: function (lines, ctx) {
        _.each(lines, function (line) {
            ctx.moveTo((line.from.x * TILE_SIZE) + HALF_TILE,
                (line.from.y * TILE_SIZE) + HALF_TILE);
            ctx.lineTo((line.to.x * TILE_SIZE) + HALF_TILE,
                (line.to.y * TILE_SIZE) + HALF_TILE);
        });
        ctx.stroke();
    },
    draw: function(ctx) {
        var greenLines = [], orangeLines = [],
            script = this.m;
        _.each(script.actions, function(action){
            if(action.variant === 'move') {
                if(script.isWithinTurn(action)) {
                    greenLines.push({from: action.from, to: action.to});
                }else {
                    orangeLines.push({from: action.from, to: action.to});
                }

            }
        });

        //draw lines for units' move actions
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'green';
        this.drawLines(greenLines, ctx);
        ctx.beginPath();
        ctx.strokeStyle = 'orange';
        this.drawLines(orangeLines, ctx);
    }
});