/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global me*/

me.plugin.patch(me.TMXTileMap, 'load', function() {
    'use strict';
    this.parent();
    this.mapLayers.push(new me.ColorLayer('background_color', '#000000',
        this.z - 10));
});

/**
 * Disable MelonJS pause function for when focus is away.
 * @return {int}
 */
me.state.pause = function() {
    'use strict';
    return 0;
};

/**
 * Disable MelonJS resume function.
 * @return {int}
 */
me.state.resume = function() {
    'use strict';
    return 0;
};

