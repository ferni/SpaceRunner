/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module*/
//HOME
var auth = require('../../state/players');

module.exports = function(req, res, next) {
    'use strict';
    res.render('choose-type/view', {
        path: '/choose-type/',
        player: players.getPlayer(req)
    });
};