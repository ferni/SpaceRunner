/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global exports*/
var auth = require('../auth');

exports.ping = function(req, res) {
  'use strict';
  res.json({ ok: true });
};

exports.disconnect = function(req, res, next) {
    try{
        auth.disconnect(req);
        res.json({ok:true});
    }catch(e) {
        next(new Error('Error while trying to disconnect'));
    }
};