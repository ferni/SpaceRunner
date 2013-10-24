/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, require, exports, module*/

var sh = require('./60_items'), _ = sh._;
if (typeof exports !== 'undefined') {
    /**
     * exports from NodeJS
     * @type {*}
     */
    sh = module.exports = sh;
}

/**
 * A crew member.
 * @type {*}
 */
sh.Unit = sh.TileEntity.extendShared({
    id: null, //the ship is in charge of setting the id
    type: 0,
    speed: 1, //tiles per second
    maxHP: 100,
    meleeDamage: 20,
    attackCooldown: 500,//time (ms) between each attack
    lastAttack: null,  //when was the last time the unit attacked
                    // (relative to turn's start)
    imageFacesRight: true,
    init: function(x, y, settings) {
        'use strict';
        this.size = [1, 1];
        if (settings.type) {
            this.type = settings.type;
        }
        if (settings.speed) {
            this.speed = settings.speed;
        }
        if (settings.maxHP) {
            this.maxHP = settings.maxHP;
        }
        if (settings.meleeDamage) {
            this.meleeDamage = settings.meleeDamage;
        }
        if (settings.attackCooldown) {
            this.attackCooldown = settings.attackCooldown;
        }
        if (settings.imageFacesRight) {
            this.imageFacesRight = settings.imageFacesRight;
        }
        this.hp = this.maxHP;
        this.owner = settings.owner;
        this.parent(x, y);
    },
    toJson: function() {
        'use strict';
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            settings: {
                type: this.type,
                speed: this.speed,
                maxHP: this.maxHP,
                meleeDamage: this.meleeDamage,
                attackCooldown: this.attackCooldown,
                imageFacesRight: this.imageFacesRight,
                owner: this.owner.toJson()
            }

        };
    },
    getTimeForOneTile: function() {
        'use strict';
        return 1000 / this.speed;
    }
});

/**
 * All the different types of units.
 */
sh.units = (function() {
    'use strict';
    var u = {};
    u.Zealot = sh.Unit.extendShared({
        init: function(x, y, settings) {
            this.type = 0;
            this.speed = 2;
            this.maxHP = 100;
            this.attackCooldown = 800;
            this.meleeDamage = 30;
            this.parent(x, y, settings);
        }
    });
    u.Critter = sh.Unit.extendShared({
        init: function(x, y, settings) {
            this.type = 5;
            this.speed = 1;
            this.maxHP = 50;
            this.attackCooldown = 420;
            this.meleeDamage = 8;
            this.imageFacesRight = false;
            this.parent(x, y, settings);
        }
    });
    u.MetalSpider = sh.Unit.extendShared({
        init: function(x, y, settings) {
            this.type = 28;
            this.speed = 3;
            this.maxHP = 200;
            this.attackCooldown = 1500;
            this.meleeDamage = 15;
            this.imageFacesRight = false;
            this.parent(x, y, settings);
        }
    });
    return u;
}());
