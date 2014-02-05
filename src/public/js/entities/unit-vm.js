/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global TileEntityVM, draw, utils, TILE_SIZE, HALF_TILE, sh, _, me*/

var UnitVM = TileEntityVM.extend({
    speed: 1, //tiles per second
    selected: false,
    size: [1, 1],
    cannonTile: [-0.25, -0.25],//image offset
    init: function(unitModel) {
        'use strict';
        this.m = unitModel;
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
                array[i] += unitModel.imgIndex * 4;
            }
            return array;
        }
        this.addAnimation('idle', toImgRow([0, 0, 0, 1, 0, 0, 0, 0]));
        this.addAnimation('walking', toImgRow([0, 1, 2, 1]));
        this.addAnimation('dead', toImgRow([3]));

        this.setCurrentAnimation('idle');
        this.setTransparency('000000');
        this.center = {x: 8, y: 8};
        this.pos.x = (this.m.x * TILE_SIZE) + HALF_TILE;
        this.pos.y = (this.m.y * TILE_SIZE) + HALF_TILE;
        this.updateHealthBar();
        this.prevModelState = {
            x: this.m.x,
            y: this.m.y,
            hp: this.m.hp,
            moving: this.m.moving,
            inCombat: this.m.inCombat,
            dizzy: this.m.dizzy
        };
    },
    getChanged: function() {
        'use strict';
        var self = this,
            changes = {};
        _.each(this.prevModelState, function(value, propName) {
            if (self.m[propName] !== value) {
                changes[propName] = true;
                self.prevModelState[propName] = self.m[propName];
            }
        });
        return changes;
    },
    updateHealthBar: function() {
        'use strict';
        this.healthBarSize = (16 * this.m.hp) / this.m.maxHP;
    },
    update: function() {
        'use strict';
        var changed = this.getChanged();
        this.parent();
        if (changed.hp) {
            this.updateHealthBar();
            if (!this.m.isAlive()) {
                this.setCurrentAnimation('dead');
                this.alpha = 0.4;
                if (this.posTween) {
                    this.posTween.stop();
                }
                return true;
            }
        }
        if (changed.moving || changed.dizzy) {
            if (!this.m.moving && !this.m.dizzy) {
                //unit stopped moving
                //smoothly adjust position
                this.centerInTile();
            }
        }
        if (changed.inCombat && !this.m.inCombat) {
            this.centerInTile();
        }
        if (this.pos.x !== this.prevX) {
            if (this.pos.x - this.prevX > 0) {
                this.faceLeft(false);
            } else {
                this.faceLeft(true);
            }
        }
        this.prevX = this.pos.x;
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
        if (this.healthBarSize <= 10) {
            color = 'orange';
        }
        if (this.healthBarSize <= 6) {
            color = 'red';
        }
        draw.line(ctx, absPosition,
            {x: absPosition.x + this.healthBarSize, y: absPosition.y},
            color, 3);
    },
    draw: function(ctx) {
        'use strict';
        var color,
            originalPos = this.pos.clone();

        this.pos.sub(this.center);
        this.parent(ctx);
        this.pos.x = originalPos.x;
        this.pos.y = originalPos.y;
        if (this.selected) {
            //draw rectangle around each selected unit
            color = this.isMine() ? 'limegreen' : 'red';
            draw.tileHighlight(ctx, this.m, color, 2);
        }
        if (this.m.isAlive()) {
            this.drawHealthBar(ctx);
        }
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
    },
    tweenTo: function(pixelPos, duration, easing) {
        'use strict';
        if (this.posTween) {
            this.posTween.stop();
        }
        this.posTween = new me.Tween(this.pos)
                .to({x: pixelPos.x, y: pixelPos.y}, duration);
        if (easing) {
            this.posTween.easing(easing);
        }
        this.posTween.start();
    },
    centerInTile: function() {
        'use strict';
        this.tweenTo({
            x: (this.m.x * TILE_SIZE) + HALF_TILE,
            y: (this.m.y * TILE_SIZE) + HALF_TILE
        }, 700, me.Tween.Easing.Sinusoidal.EaseOut);
    }
});
