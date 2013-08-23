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
    m: null, //the script model
    init: function(battleScreen){
        this.screen = battleScreen;
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
        draw.circle(ctx, _.last(moveActions).to, 5, color);
    },
    isSelected: function(unitID) {
        var unitVM = this.screen.shipVM.getVM(gs.ship.getUnitByID(unitID));
        return unitVM.selected;
    },
    draw: function(ctx) {
        var self = this,
            script = this.m;
        _.each(script.byUnit, function(actions, unitID) {
            ctx.save();
            if(!self.isSelected(unitID)) {
                ctx.globalAlpha = 0.5;
            }
            self.drawPath(_.filter(actions, function(a){
                return script.isWithinTurn(a) && a.variant === 'move';
            }) ,ctx, 'green');
            self.drawPath(_.filter(actions, function(a){
                return !script.isWithinTurn(a) && a.variant === 'move';
            }) ,ctx, 'orange');
            ctx.restore();
        });
    }
});