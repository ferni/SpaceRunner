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
    init: function(x, y, settings) {
        'use strict';
        this.size = [1, 1];
        settings = this.completeSettings(settings);
        this.speed = settings.speed;
        this.type = settings.type;
        this.owner = settings.owner;
        this.parent(x, y);
    },
    completeSettings: function(settings) {
        'use strict';
        if (!settings) {
            settings = {};
        }
        if (!settings.type) {
            settings.type = 0;
        }
        if (!settings.speed) {
            settings.speed = 1;
        }
        return settings;
    },
    toJson: function() {
        'use strict';
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            settings: {
                speed: this.speed,
                type: this.type,
                owner: this.owner.toJson()
            }

        };
    },
    getTimeForOneTile: function() {
        'use strict';
        return 1000 / this.speed;
    }
});
