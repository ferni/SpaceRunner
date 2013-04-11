/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, TileEntity*/

var Unit = TileEntity.extend({
    pendingOrders: [],
    executing: null,
    _paused: true,
    speed: 1, //tiles per second
    path:[],
    init: function(x, y) {
        'use strict';

        this.parent(x, y, {image: 'unit_robot_alien'});
        this.addAnimation('idle', [0,1,2,1]);

        this.setCurrentAnimation('idle');
        this.setTransparency('000000');

    },
    pause: function(){
       this._paused = true;
    },
    resume: function(){
       this._paused = false;
    },
    draw: function(ctx){
       this.parent(ctx);
    },
    update: function(){
        if(this._paused){
            //if one does not return true, melonjs breaks
            return true;
        }
        this.parent();

        //do stuff

        return true;
    },
    giveMoveOrder: function(){

    },
    //the time it takes to traverse one tile in seconds
    getTileTraversalTime: function(){
        return 0.5;
    }
});

