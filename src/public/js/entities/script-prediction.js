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
    m: null, //the script model
    init: function(battleScreen) {
        'use strict';
        this.screen = battleScreen;
    },
    drawPath: function(moveActions, ctx, color) {
        'use strict';
        if (moveActions.length === 0) {
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
        'use strict';
        var unitVM = this.screen.shipVM.getVM(gs.ship.getUnitByID(unitID));
        return unitVM.selected;
    },
    draw: function(ctx) {
        'use strict';
        var self = this,
            script = this.m;
        _.each(script.byUnit, function(actions, unitID) {
            ctx.save();
            if (!self.isSelected(unitID)) {
                ctx.globalAlpha = 0.5;
            }
            self.drawPath(_.filter(actions, function(a) {
                return script.isWithinTurn(a) &&
                    a instanceof sh.actions.Move;
            }), ctx, 'green');
            self.drawPath(_.filter(actions, function(a) {
                return !script.isWithinTurn(a) &&
                    a instanceof sh.actions.Move;
            }), ctx, 'orange');
            ctx.restore();
        });
    },
    predict: function() {
        'use strict';
        this.m = sh.createScript(this.screen.verifiedOrders, gs.ship.clone(),
            this.screen.turnDuration);
    },
    clear: function() {
        'use strict';
        this.m = [];
    }
});
