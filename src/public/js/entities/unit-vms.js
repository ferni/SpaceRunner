/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global TileEntityVM, draw, utils, TILE_SIZE, HALF_TILE, sh, _, me, ko, gs*/

var UnitVM = TileEntityVM.extend({
    speed: 1, //tiles per second
    size: [1, 1],
    cannonTile: [-0.25, -0.25],//image offset
    init: function(unitModel) {
        'use strict';
        this.m = unitModel;
        this.size = unitModel.size;
        this.speed = unitModel.speed;
        this.selectionColor = utils.isMine(this.m) ? 'teal' : 'red';
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
        this.orderVMs = [];
        this.orders = ko.observableArray(unitModel.orders);
        this.orders.subscribe(function(newValue) {
            this.m.orders = newValue;
        }, this);
        this.isSelectable = true;
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
        if (utils.updateVMs(this.m.orders, this.orderVMs, 300)) {
            me.game.sort();
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
        var originalPos = this.pos.clone();

        this.pos.sub(this.center);
        this.parent(ctx);
        this.pos.x = originalPos.x;
        this.pos.y = originalPos.y;
        if (this.selected()) {
            this.drawOrders(ctx);
        }
        if (this.m.isAlive()) {
            this.drawHealthBar(ctx);
        }
    },
    drawOrders: function(ctx) {
        'use strict';
        var from = this.pos; //starting position
        _.each(this.orders(), function(o) {
            var to = sh.v.mul(o.destination, TILE_SIZE);
            to.x += HALF_TILE;
            to.y += HALF_TILE;
            draw.line(ctx, from, to, 'green', 2);
            from = to;
        });
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
    },
    playAttack: function() {
        'use strict';
        console.log('melee unit attacked!');
    },
    onMouseUp: function() {
        'use strict';
        //deselect all the units first
        _.chain(gs.selected)
            .where({name: 'unit'})
            .invoke('deselect');
        this.parent();
    },
    onSelected: function() {
        'use strict';
        console.log('Selected unit ' + this.m.id + ' - pos: ' +
            sh.v.str(this.m) + ', GUID: ' + this.GUID);
        me.state.current().updateUnitHud();
        _.invoke(this.orderVMs, 'show');
    },
    onDeselected: function() {
        'use strict';
        _.invoke(this.orderVMs, 'deselect');
        me.state.current().updateUnitHud();
        _.invoke(this.orderVMs, 'hide');
    }
});

var unitVMs = {};

/**
 * ViewModel for sh.units.Zealot unit
 * @type {void|*|Class|extend|extend|extend}
 */
unitVMs.ZealotVM = UnitVM.extend({
    /**
     * Shoot a projectile at target
     * @param {{x:{int}, y:{int}}} targetPos
     */
    playAttack: function(targetPos) {
        'use strict';
        var bullet, tween;
        console.log('zealot attacking');
        bullet = new me.ObjectEntity(this.pos.x, this.pos.y, {
            image: 'projectile'
        });
        me.game.add(bullet, 3000);
        tween = new me.Tween(bullet.pos).to(targetPos, 300)
            .onComplete(function() {
                me.game.remove(bullet, true);
            });
        tween.start();
    }
});
