/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global TileEntityVM, me*/

/* The red overlay */
var ui = {};
/**
 * A transparent red overlay.
 * @type {*}
 */
ui.RedColorEntity = TileEntityVM.extend({
    init: function(x, y) {
        'use strict';
        this.size = [1, 1];
        this.parent(x, y, {
            image: 'selector',
            name: 'red'
        });
        this.zIndex = 200;
    }
});

/**
 * A drag-box to select units.
 * @type {*}
 */
ui.DragBox = me.Rect.extend({
    /**
     *
     * @param {me.Vector2d} pivot The pivot position.
     */
    init: function(pivot) {
        'use strict';
        //the pivot doesn't move
        this.piv = pivot;
        this.parent(new me.Vector2d(pivot.x, pivot.y), 1, 1);
    },
    draw: function(ctx) {
        'use strict';
        this.parent(ctx);
        ctx.fillStyle = 'rgba(0,0,255,0.3)';
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 1;
        ctx.fillRect(this.pos.x, this.pos.y, this.width, this.height);
        ctx.strokeRect(this.pos.x, this.pos.y, this.width, this.height);
    },
    updateFromMouse: function(mouse) {
        'use strict';
        if (mouse.x > this.piv.x) {
            this.width = mouse.x - this.piv.x;
        } else {
            //the width must not have negative values or
            //else the 'contains' method would not work
            this.pos.x = mouse.x;
            this.width = this.piv.x - mouse.x;
        }

        if (mouse.y > this.piv.y) {
            this.height = mouse.y - this.piv.y;
        } else {
            //the height must not have negative values or
            //else the 'contains' method would not work
            this.pos.y = mouse.y;
            this.height = this.piv.y - mouse.y;
        }
    }
});

/**
 * A little star that shows up when a melee hit occurs.
 * @type {*}
 */
ui.StarHit = me.ObjectEntity.extend({
    init: function(unitVM) {
        'use strict';
        this.parent(unitVM.pos.x, unitVM.pos.y,
            {image: 'star_hit_white', spritewidth: 16, spriteheight: 16});
        this.fadeCountdown = 30;
    },
    update: function() {
        'use strict';
        this.parent();
        this.alpha -= 0.03;
        this.fadeCountdown--;
        if (this.fadeCountdown === 0) {
            me.game.remove(this);
        }
    }
});
