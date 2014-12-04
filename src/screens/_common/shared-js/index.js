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
    require('./general-stuff'),
    require('./utils'),
    require('./placement-rules'),
    require('./classes/shared-class'),
    require('./classes/jsonable'),
    require('./classes/player'),
    require('./classes/tile-entity'),
    require('./classes/items'),
    require('./classes/units'),
    require('./classes/map'),
    require('./classes/ship'),
    require('./classes/battle'),
    require('./classes/actions'),
    require('./classes/orders'),
    require('./classes/script'),
    require('./create-script')
    );