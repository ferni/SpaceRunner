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
    drawCircle: function(position, ctx, color){
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc((position.x  * TILE_SIZE) + HALF_TILE,
            (position.y * TILE_SIZE) + HALF_TILE,
                5, 0, Math.PI * 2, false);
        ctx.fill();
    },
    drawPath: function(moveActions, ctx, color) {
        if(moveActions.length === 0) {
            return;
        }
        ctx.beginPath();
        ctx.save();
        ctx.lineWidth = 3;
        ctx.strokeStyle = color;
        _.each(moveActions, function(action) {
            ctx.moveTo((action.from.x * TILE_SIZE) + HALF_TILE,
                (action.from.y * TILE_SIZE) + HALF_TILE);
            ctx.lineTo((action.to.x * TILE_SIZE) + HALF_TILE,
                (action.to.y * TILE_SIZE) + HALF_TILE);
        });
        ctx.stroke();
        ctx.restore();
        this.drawCircle(_.last(moveActions).to, ctx, color);
    },
    draw: function(ctx) {
        var self = this,
            script = this.m;
        _.each(script.byUnit, function(actions){
            self.drawPath(_.filter(actions, function(a){
                return script.isWithinTurn(a) && a.variant === 'move';
            }) ,ctx, 'green');
            self.drawPath(_.filter(actions, function(a){
                return !script.isWithinTurn(a) && a.variant === 'move';
            }) ,ctx, 'orange');
        });
    }
});