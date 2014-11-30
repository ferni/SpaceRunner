/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global exports, require*/

var auth = require('../screens/_common/server-js/auth'),
    sh = require('../shared');

/**
 * Checks if the server is online.
 * @param {Object} req
 * @param {Object} res
 */
exports.ping = function(req, res) {
    'use strict';
    res.json({ ok: true });
};

/**
 * Gets an array of all the properties of sh , (the namespace for the
 * shared code between server and client.
 * This is used to compare the properties of server and client to
 * ensure that they are the same.
 * @param {Object} req
 * @param {Object} res
 */
exports.sharedprops = function(req, res) {
    'use strict';
    res.json({properties: sh.getProperties(sh)});
};

