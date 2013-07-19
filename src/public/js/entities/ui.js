/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global TileEntityVM*/

/* The red overlay */
var RedColorEntity = TileEntityVM.extend({
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

var DragBox = me.Rect.extend({
    /**
     *
     * @param pivot {me.Vector2d} The pivot position.
     */
    init: function(pivot) {
        'use strict';
        //the pivot doesnt move
        this.piv = pivot;
        this.parent(new me.Vector2d(pivot.x, pivot.y), 1, 1);
    },
    draw: function(ctx){
        'use strict';
        this.parent(ctx);
        ctx.fillStyle = 'rgba(0,0,255,0.3)';
        ctx.strokeStyle = 'blue';
        ctx.fillRect(this.pos.x, this.pos.y, this.width, this.height);
        ctx.strokeRect(this.pos.x, this.pos.y, this.width, this.height);
    },
    updateFromMouse: function(mouse) {
        'use strict';
        if(mouse.x > this.piv.x) {
            this.width = mouse.x - this.piv.x;
        } else{
            //the width must not have negative values or
            //else the 'contains' method would not work
            this.pos.x = mouse.x;
            this.width = this.piv.x - mouse.x;
        }

        if(mouse.y > this.piv.y) {
            this.height = mouse.y - this.piv.y;
        } else{
            //the height must not have negative values or
            //else the 'contains' method would not work
            this.pos.y = mouse.y;
            this.height = this.piv.y - mouse.y;
        }
    }
});