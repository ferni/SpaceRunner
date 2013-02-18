/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global TileObject*/

/* The red overlay */
var RedColorObject = TileObject.extend({
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

var Button = me.GUI_Object.extend({
    fontObject: null,
    text: '',
    init: function (text, x, y, settings) {
        if(!settings){
            settings = {};
        }
        if(!settings.image){
            settings.image = 'button';
        }
        if(!settings.name){
            settings.name = 'button';
        }
        this.parent(x, y, settings);
        this.text = text;
        this.setTransparency('#FFFFFF');
        this.fontObject = new me.Font('Arial', 16, 'white');
        this.fontObject.bold();

    },
    draw: function (context) {
        this.parent(context);
        this.fontObject.draw(me.video.getScreenContext(),
            this.text, this.pos.x + 20, this.pos.y + 24);
    }
});

var ShipSelectButton = Button.extend({
    tmxName: '',
    init: function (text, x, y, race, type) {
        this.tmxName = race + '_' + type;
        this.parent(text, x, y);
        
    },
    onClick: function () {
        me.state.set(me.state.BUILD, new ShipBuildingScreen(this.tmxName));
        me.state.change(me.state.BUILD);
    }
});