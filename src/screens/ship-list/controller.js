/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module*/
//HOME
var auth = require('../_common/server-js/auth'),
    hulls = require('../_common/server-js/saved-hulls'),
    _ = require('underscore')._;

module.exports = function(req, res, next) {
    'use strict';
    hulls.getAll(function(error, hulls) {
        var view;
        if (error) {
            res.render('_common/error', {error: error});
        }
        view = req.query.edit ? 'edit' : 'view';
        res.render('ship-list/' + view, {
            path: '/ship-list/',
            hulls: hulls,
            player: auth.getPlayer(req)
        });
    });
};