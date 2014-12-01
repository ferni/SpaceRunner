/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, exports, module, xyz*/

var sh = module.exports,
    Jsonable = require('./jsonable').Jsonable;

(function() {
    'use strict';
    sh.Player = Jsonable.extendShared({
        init: function(json) {
            this.setJson({
                type: 'Player',
                properties: ['id', 'name'],
                json: json
            });
        }
    });
}());
