/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me*/

var Unit = TileEntity.extend({
    pendingOrders: [],
    executing: null,
    init: function(x, y) {
        'use strict';

        this.parent(x, y, {image: 'unit_robot_alien'});
        this.addAnimation('idle', [0,1,2,1]);

        this.setCurrentAnimation('idle');
        this.setTransparency('000000');

    },
    update: function(){
        this.parent();

    }
});

