/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global */

var Unit = TileEntityVM.extend({
    speed: 1, //tiles per second
    selected: false,
    size: [1, 1],
    cannonTile: [-0.25, -0.25],//image offset
    init: function(unitModel) {
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
        function toImgRow(array){
            for(var i = 0; i < array.length; i++){
                array[i] += unitModel.type * 4;
            }
            return array;
        }
        this.addAnimation('idle', toImgRow([0, 1, 2, 1]));

        this.setCurrentAnimation('idle');
        this.setTransparency('000000');
    },
    putInCenter: function(){
        this.cannonTile = [-0.25, -0.25];
        this.updatePixelX();
        this.updatePixelY();
    },
    putInTopRight: function(){
        this.cannonTile = [-0.5, 0];
        this.updatePixelX();
        this.updatePixelY();
    },
    putInBottomLeft: function(){
        this.cannonTile = [0, -0.5];
        this.updatePixelX();
        this.updatePixelY();
    },
    update: function(){
        this.parent();

        if(this.prevPos.x !== this.m.x) {
            this.setX(this.m.x);
            this.prevPos.x = this.m.x;
        }
        if(this.prevPos.y !== this.m.y) {
            this.setY(this.m.y);
            this.prevPos.y = this.m.y;
        }

        return true;
    },
    onShip: function(){
        return this.m.ship;
    },
    draw: function(ctx){
        'use strict';
        var color;
        this.parent(ctx);
        if (this.selected) {
            //draw rectangle around each selected unit
            color = this.isMine() ? 'limegreen' : 'red';
            draw.tileHighlight(ctx, this.m, color, 2);
        }
    },
    isMine: function(){
        return utils.isMine(this.m);
    }
});
