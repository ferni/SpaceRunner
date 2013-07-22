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
    init: function(unitModel) {
        this.m = unitModel;
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
        };
        this.addAnimation('idle', toImgRow([0, 1, 2, 1]));

        this.setCurrentAnimation('idle');
        this.setTransparency('000000');
    },
    onShip: function(){
        return this.m.ship;
    },
    draw: function(ctx){
        'use strict';
        this.parent(ctx);
    }
});
