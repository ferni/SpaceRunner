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
var ScriptVM = Object.extend({
    init: function(model){
        this.m = model;
    },
    draw: function(ctx) {
        var linesToDraw = [];
        _.each(this.m, function(action){
            if(action.variant === 'move') {
                //draw a line
                linesToDraw.push({from: action.from, to: action.to});
            }
        });

        //draw lines for units' move actions
        ctx.beginPath();
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 3;
        _.each(linesToDraw, function(line){
            ctx.moveTo((line.from.x * TILE_SIZE) + HALF_TILE,
                (line.from.y * TILE_SIZE) + HALF_TILE);
            ctx.lineTo((line.to.x * TILE_SIZE) + HALF_TILE,
                (line.to.y * TILE_SIZE) + HALF_TILE);
        });
        ctx.stroke();
    }
});