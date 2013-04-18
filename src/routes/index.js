/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global exports*/

/**
* Gets the homepage
* @param {Object} req request object.
* @param {Object} res response object.
*/
exports.index = function(req, res) {
  'use strict';
  res.render('index', { title: 'Express' });
};

