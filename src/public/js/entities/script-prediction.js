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
    drawPathLine: function (moveAction, ctx, color){
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.moveTo((moveAction.from.x * TILE_SIZE) + HALF_TILE,
            (moveAction.from.y * TILE_SIZE) + HALF_TILE);
        ctx.lineTo((moveAction.to.x * TILE_SIZE) + HALF_TILE,
            (moveAction.to.y * TILE_SIZE) + HALF_TILE);
        ctx.stroke();
    },
    drawCircle: function(position, ctx, color){
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc((position.x  * TILE_SIZE) + HALF_TILE,
            (position.y * TILE_SIZE) + HALF_TILE,
            HALF_TILE / 2, 0, Math.PI * 2, false);
        ctx.fill();
    },
    draw: function(ctx) {
        var self = this,
            script = this.m;

        ctx.lineWidth = 3;
        _.each(script.byUnit, function(actions){
            var last;
            _.each(actions, function(action) {
                if(script.isWithinTurn(action)) {
                    self.drawPathLine(action, ctx, 'green');
                    last = action;
                }
            });
            if(last) {
                self.drawCircle(last.to, ctx, 'green');
            }
        });

        _.each(script.byUnit, function(actions){
            var last;
            _.each(actions, function(action) {
                if(!script.isWithinTurn(action)) {
                    self.drawPathLine(action, ctx, 'orange');
                    last = action;
                }
            });
            if(last) {
                self.drawCircle(last.to, ctx, 'orange');
            }
        });
    }
});