/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global TileEntityVM, me, sh, TILE_SIZE*/

var ui = (function() {
    'use strict';
    var ui = {};
    /**
     * A transparent red overlay.
     * @type {*}
     */
    ui.RedColorEntity = TileEntityVM.extend({
        init: function(x, y) {
            this.size = [1, 1];
            this.parent(x, y, {
                image: 'selector',
                name: 'red'
            });
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
            //the pivot doesn't move
            this.piv = pivot;
            this.parent(new me.Vector2d(pivot.x, pivot.y), 1, 1);
        },
        draw: function(ctx) {
            this.parent(ctx);
            ctx.fillStyle = 'rgba(0,0,255,0.3)';
            ctx.strokeStyle = 'blue';
            ctx.lineWidth = 1;
            ctx.fillRect(this.pos.x, this.pos.y, this.width, this.height);
            ctx.strokeRect(this.pos.x, this.pos.y, this.width, this.height);
        },
        updateFromMouse: function(mouse) {
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
     * Makes the object fade a little. (Use on objects' update to
     * make it fade until it disappears).
     * @param {*} object The object to fade.
     */
    function fade(object) {
        if (object.fadeCountdown === undefined) {
            object.fadeCountdown = 30;
        }
        object.alpha -= 0.03;
        object.fadeCountdown--;
        if (object.fadeCountdown === 0) {
            me.game.remove(object);
        }
    }

    /**
     * A little star that shows up when a melee hit occurs.
     * @type {*}
     */
    ui.StarHit = me.ObjectEntity.extend({
        init: function(unitVM) {
            this.parent(unitVM.pos.x - 8, unitVM.pos.y - 8,
                {image: 'star_hit_white', spritewidth: 16, spriteheight: 16,
                    name: 'star_hit'});
        },
        update: function() {
            this.parent();
            fade(this);
        }
    });


    /**
     * A number that floats upwards.
     * @type {*}
     */
    ui.FloatingNumber = me.ObjectEntity.extend({
        fontObject: null,
        init: function(pos, value) {
            var color;
            this.parent(pos.x, pos.y, {image: 'nothing'});
            this.pos = pos;
            this.verticalOffset = 0;
            this.value = value;
            color = value < 0 ? 'red' : 'green';
            this.fontObject = new me.Font('Lucida Console', 14, color);
            //this.fontObject.bold();

        },
        draw: function(context) {
            this.parent(context);
            context.save();
            context.globalAlpha = this.alpha;
            this.fontObject.draw(me.video.getScreenContext(),
                this.value, this.pos.x, this.pos.y + this.verticalOffset);
            context.restore();
        },
        update: function() {
            this.parent();
            this.verticalOffset -= 0.3;//goes up a little.
            fade(this);
        }
    });


    ui.Cloud = me.ObjectEntity.extend({
        init: function(tile) {
            this.parent(tile.x * TILE_SIZE,
                tile.y * TILE_SIZE,
                {
                    image: 'cloud',
                    spritewidth: 32,
                    spriteheight: 32
                });
            this.alpha = 0.3;
        },
        update: function() {
            if (me.state.current().name === 'battle' &&
                    !me.state.current().paused) {
                this.angle += 0.1;
            }
        }
    });

    /**
     * A button with text.
     * @type {*}
     */
    ui.Button = me.GUI_Object.extend({
        fontObject: null,
        text: '',
        init: function(text, x, y, settings) {
            if (!settings) {
                settings = {};
            }
            if (!settings.image) {
                settings.image = 'button';
            }
            if (!settings.name) {
                settings.name = 'button';
            }
            this.parent(x, y, settings);
            this.text = text;
            this.setTransparency('#FFFFFF');
            this.fontObject = new me.Font('Arial', 16, 'white');
            this.fontObject.bold();

        },
        draw: function(context) {
            this.parent(context);
            this.fontObject.draw(me.video.getScreenContext(),
                this.text, this.pos.x + 20, this.pos.y + 24);
        },
        onClick: function() {
        }
    });

    ui.ChargingWeaponIcon = me.ObjectEntity.extend({
        init: function(unitVM) {
            this.parent(unitVM.pos.x - 8, unitVM.pos.y - 8, {
                image: 'charging-weapon-icon',
                spritewidth: 16,
                spriteheight: 16
            });
            this.alpha = 0.8;
        }
    });

    //for the z index
    ui.layers = {
        items: 10,
        colorOverlay: 20,
        units: 30,
        effects: 40,
        indicators: 50
    };
    return ui;
}());

