/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me, require, exports, module*/

var sh = require('./65_make'), _ = sh._;
if (typeof exports !== 'undefined') {
    /**
     * exports from NodeJS
     * @type {*}
     */
    sh = module.exports = sh;
}

/**
 * An Array2d.
 * @type {*}
 */
sh.Map = sh.SharedClass.extendShared({
    init: function(raw) {
        'use strict';
        //check consistent width
        var i, width;
        if (!raw) {
            throw 'raw parameter mandatory.';
        }
        width = raw[0].length;
        for (i = raw.length - 2; i >= 0; i--) {
            if (raw[i].length !== width) {
                throw 'the raw map has not consistent width';
            }
        }
        this.width = width;
        this.height = raw.length;
        this.raw = raw;
    },
    clear: function() {
        'use strict';
        var raw = this.raw;
        this.tiles(function(x, y) {
            raw[y][x] = 0;
        });
    },
    set: function(x, y, value) {
        'use strict';
        if (this.isInBounds(x, y)) {
            this.raw[y][x] = value;
        } else {
            throw 'Cannot set map at ' + x + ',' + y + ': out of bounds.';
        }
    },
    at: function(x, y) {
        'use strict';
        return this.raw[y] !== undefined ? this.raw[y][x] : undefined;
    },
    isInBounds: function(x, y) {
        'use strict';
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    },
    tiles: function(callback) {
        'use strict';
        var y, x;
        for (y = this.height - 1; y >= 0; y--) {
            for (x = this.width - 1; x >= 0; x--) {
                callback(x, y);
            }
        }
    }
});

/**
 * A map of sh.TileEntity (which have x and y position)
 * @type {*}
 */
sh.EntityMap = sh.Map.extendShared({
    init: function(width, height, entityArray) {
        'use strict';
        this.parent(sh.utils.getEmptyMatrix(width, height, 0));
        this.changed = true;
        this.entities = entityArray;
        this.update();
    },
    update: function() {
        'use strict';
        var self = this;
        this.clear();
        _.each(this.entities, function(e) {
            e.tiles(function(x, y) {
                self.set(x, y, e);
            }, self);
        });
        this.changed = true;
    }
});

/**
 * Each tile holds an array of entities.
 * @type {*}
 */
sh.EntityMap3d = sh.Map.extendShared({
    init: function(width, height, entityArray) {
        'use strict';
        this.parent(sh.utils.getEmptyMatrix(width, height, 0));
        this.changed = true;
        this.entities = entityArray;
        this.update();
    },
    update: function() {
        'use strict';
        var self = this;
        this.clear();
        _.each(this.entities, function(e) {
            e.tiles(function(x, y) {
                if (!self.at(x, y)) {
                    self.set(x, y, []);
                }
                self.at(x, y).push(e);
            }, self);
        });
        this.changed = true;
    }
});

/**
 * A group of maps. The at function returns the last map that
 * has something in position (parameter) that is other than 0.
 * @type {*}
 */
sh.CompoundMap = sh.Map.extendShared({
    init: function(maps) {
        'use strict';
        if (!maps) {
            throw 'maps parameter mandatory.';
        }
        //check sizes
        (function() {
            var width = maps[0].width,
                height = maps[0].height,
                i;
            for (i = 1; i < maps.length; i++) {
                if (maps[i].width !== width ||
                        maps[i].height !== height) {
                    throw 'Maps for Compound should be the same size.';
                }
            }
        }());
        this.width = maps[0].width;
        this.height = maps[0].height;
        this.maps = maps;
    },
    at: function(x, y) {
        'use strict';
        var i, what;
        for (i = this.maps.length - 1; i >= 0; i--) {
            what = this.maps[i].at(x, y);
            if (what) {
                return what;
            }
        }
        return null;
    }
});

