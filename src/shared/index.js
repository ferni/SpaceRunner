/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module*/

var _ = require('underscore')._,
    sh = {};

sh.PF = require('pathfinding');
module.exports = _.extend(sh,
    require('./10_general-stuff'),
    require('./12_utils'),
    require('./20_placement-rules'),
    require('./25_classes/10_shared-class'),
    require('./25_classes/20_jsonable'),
    require('./25_classes/25_player'),
    require('./25_classes/30_tile-entity'),
    require('./25_classes/32_items'),
    require('./25_classes/34_units'),
    require('./25_classes/40_map'),
    require('./25_classes/50_ship'),
    require('./25_classes/55_battle'),
    require('./25_classes/60_actions'),
    require('./25_classes/70_orders'),
    require('./25_classes/80_script'),
    require('./40_create-script')
    );