/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, asyncTest, test, ok, equal, start, th,
me, $, utils, ui, ship, screen*/

module('mainlink.js');
asyncTest('Item click', function() {
   'use strict';
    th.onLevelReady(function() {
        $('.items #item_weapon').trigger('click');
        equal(ui.chosen.type, 'weapon', 'choose weapon');
        ok($('.items #item_weapon').hasClass('chosen'),
            "weapon thumbnail has 'chosen' class");

        $('.items #item_engine').trigger('click');
        equal(ui.chosen.type, 'engine', 'choose engine');
        ok($('.items #item_engine').hasClass('chosen'),
            "engine thumbnail has 'chosen' class");
        ok(!$('.items #item_weapon').hasClass('chosen'),
            "now weapon does not longer have 'chosen' class");
        start();
    });
});
