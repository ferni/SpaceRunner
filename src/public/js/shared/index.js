/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global */

var sh = require('./30_ship'), _ = sh._;
if(typeof exports !== 'undefined'){
    sh = module.exports = sh;
}

//remove underscore from sh
sh._ = undefined;