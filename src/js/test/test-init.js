/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global QUnit*/
QUnit.config.autostart = false;

QUnit.done(function(e) {
    'use strict';
});

th.onGameReady(function () {
    QUnit.start();
});