/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global require, module*/
//HOME
var auth = require('../_common/server-js/auth');

/**
 * Initializes the entire app. Creates the player
 session, or returns the player state if a session is
 already present.
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
module.exports = function(req, res, next) {
    'use strict';
    res.render('ship-list/view');
};