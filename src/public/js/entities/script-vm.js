/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global */

var ScriptVM = Object.extend({
    init: function(model){
        this.m = model;
    },
    draw: function(ctx) {
        var linesToDraw = [];
        _.each(this.m, function(actions, unitID){
            _.each(actions, function(action) {
                if(action.variant === 'move') {
                    //draw a line
                    linesToDraw.push({from: action.from, to: action.to});
                }
            });
        });

        //draw lines for units' move actions
        ctx.beginPath();
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 3;
        _.each(linesToDraw, function(line){
            ctx.moveTo((line.from[0] * TILE_SIZE) + HALF_TILE,
                (line.from[1] * TILE_SIZE) + HALF_TILE);
            ctx.lineTo((line.to[0] * TILE_SIZE) + HALF_TILE,
                (line.to[1] * TILE_SIZE) + HALF_TILE);
        });
        ctx.stroke();
    }
});