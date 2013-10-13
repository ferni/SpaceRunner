/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global TileEntityVM, draw, utils, TILE_SIZE, HALF_TILE, sh*/

var Unit = TileEntityVM.extend({
    speed: 1, //tiles per second
    selected: false,
    size: [1, 1],
    cannonTile: [-0.25, -0.25],//image offset
    init: function(unitModel) {
        'use strict';
        this.m = unitModel;
        this.prevPos = {
            x: this.m.x,
            y: this.m.y
        };
        this.size = unitModel.size;
        this.speed = unitModel.speed;
        this.parent(unitModel.x, unitModel.y, {
            name: 'unit',
            image: 'creatures_16x16',
            spritewidth: 16,
            spriteheight: 16
        });
        function toImgRow(array) {
            var i;
            for (i = 0; i < array.length; i++) {
                array[i] += unitModel.type * 4;
            }
            return array;
        }
        this.addAnimation('idle', toImgRow([0, 1, 2, 1]));
        this.addAnimation('dead', toImgRow([3]));

        this.setCurrentAnimation('idle');
        this.setTransparency('000000');
        this.center = {x: 8, y: 8};
        this.pos.x = (this.m.x * TILE_SIZE) + HALF_TILE;
        this.pos.y = (this.m.y * TILE_SIZE) + HALF_TILE;
    },
    update: function() {
        'use strict';
        this.parent();

        return true;
    },
    onShip: function() {
        'use strict';
        return this.m.ship;
    },
    drawHealthBar: function(ctx) {
        'use strict';
        var color = 'green',
            relPosition = {x: -8, y: 10},
            absPosition = sh.v.add(this.pos, relPosition);
        if (this.hp === undefined) {
            this.hp = this.m.hp;
        }
        if (this.prevHP !== this.hp) {
            //recalculate health bar size
            this.healthBarSize = (16 * this.hp) / this.m.maxHP;
        }
        if (this.healthBarSize <= 10) {
            color = 'orange';
        }
        if (this.healthBarSize <= 6) {
            color = 'red';
        }
        draw.line(ctx, absPosition,
            {x: absPosition.x + this.healthBarSize, y: absPosition.y},
            color, 3);
        /*
        draw.line(ctx, {x: this.pos.x + this.healthBarSize, y: this.pos.y + 17},
            {x: this.pos.x + 16, y: this.pos.y + 17},
            'whitesmoke', 3);*/
        this.prevHP = this.hp;
    },
    draw: function(ctx) {
        'use strict';
        var color,
            originalPos = this.pos.clone();

        this.pos.sub(this.center);
        this.parent(ctx);
        this.pos = originalPos;
        if (this.selected) {
            //draw rectangle around each selected unit
            color = this.isMine() ? 'limegreen' : 'red';
            draw.tileHighlight(ctx, this.m, color, 2);
        }
        this.drawHealthBar(ctx);
    },
    isMine: function() {
        'use strict';
        return utils.isMine(this.m);
    },
    /**
     * Sets if the unit should face left.
     * @param {Boolean} faceLeft
     */
    faceLeft: function(faceLeft) {
        'use strict';
        if (this.m.imageFacesRight) {
            faceLeft = !faceLeft;
        }
        this.flipX(!faceLeft);
    }
});
