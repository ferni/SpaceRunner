/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global itemVMs, sh, UnitVM, unitVMs, orderVMs*/

/**
 * Factories for entities
 */
var make = (function() {
    'use strict';
    var make = {};

    make.item = function(type, params) {
        var Constructor, model;
        if (!params) {
            params = [0, 0];
        }
        model = new sh.items[type]({x: params[0], y: params[1]});
        Constructor = itemVMs[type];
        return new Constructor(model);
    };

    return make;
}());
