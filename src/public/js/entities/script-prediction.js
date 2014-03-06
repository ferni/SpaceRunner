/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global draw, gs, _, TILE_SIZE, HALF_TILE, sh*/

/**
 * Displays the script on the screen.
 * @type {*}
 */
var ScriptPrediction = Object.extend({
    script: null, //the script model
    init: function(battleScreen) {
        'use strict';
        this.screen = battleScreen;
    },
    drawPath: function(lines, ctx, color) {
        'use strict';
        if (lines.length === 0) {
            return;
        }
        ctx.beginPath();
        ctx.save();
        ctx.lineWidth = 3;
        ctx.strokeStyle = color;
        _.each(lines, function(line) {
            ctx.moveTo((line.from.x * TILE_SIZE) + HALF_TILE,
                (line.from.y * TILE_SIZE) + HALF_TILE);
            ctx.lineTo((line.to.x * TILE_SIZE) + HALF_TILE,
                (line.to.y * TILE_SIZE) + HALF_TILE);
        });
        ctx.stroke();
        ctx.restore();
        draw.circle(ctx, _.last(lines).to, 5, color);
    },
    isSelected: function(unitID) {
        'use strict';
        var unitVM = this.screen.shipVM.getVM(gs.ship.getUnitByID(unitID));
        return unitVM.selected();
    },
    draw: function(ctx) {
        'use strict';
        var self = this,
            script = this.script;
        _.each(script.byUnit, function(actions, unitID) {
            ctx.save();
            if (!self.isSelected(unitID)) {
                ctx.globalAlpha = 0.5;
            }
            self.drawPath(_.filter(actions, function(a) {
                return script.isWithinTurn(a) &&
                    a instanceof sh.actions.Move;
            }), ctx, 'green');
            ctx.restore();
        });
        //unfulfilled orders
        //(disabled, incompatible with new order scheme)
        /*
        if (!this.resultingShip) {
            return;
        }
        _.each(this.resultingShip.units, function(u) {
            ctx.save();
            if (!self.isSelected(u.id)) {
                ctx.globalAlpha = 0.5;
            }
            self.drawPath(u.orders, ctx, 'orange');
            ctx.restore();
        });    */
    },
    predict: function() {
        'use strict';
        this.resultingShip = gs.ship.clone();
        this.script = sh.createScript(gs.ship.extractOrders(),
            this.resultingShip, this.screen.turnDuration);
    },
    clear: function() {
        'use strict';
        this.script = [];
        this.resultingShip = null;
    }
});
