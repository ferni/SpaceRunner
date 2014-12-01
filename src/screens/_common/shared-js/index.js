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
    require('./25_classes/shared-class'),
    require('./25_classes/jsonable'),
    require('./25_classes/player'),
    require('./25_classes/tile-entity'),
    require('./25_classes/items'),
    require('./25_classes/units'),
    require('./25_classes/map'),
    require('./25_classes/ship'),
    require('./25_classes/battle'),
    require('./25_classes/actions'),
    require('./25_classes/orders'),
    require('./25_classes/script'),
    require('./create-script')
    );