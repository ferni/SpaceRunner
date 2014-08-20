/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module, xyz*/

var sh = require('../25_classes/20_jsonable'), _ = sh._;
if (typeof exports !== 'undefined') {
    /**
     * exports from NodeJS
     * @type {*}
     */
    sh = module.exports = sh;
}

(function() {
    'use strict';
    sh.Player = sh.Jsonable.extendShared({
        init: function (json) {
            this.setJson({
                type: 'Player',
                properties: ['id', 'name'],
                json: json
            });
        }
    });
}());
