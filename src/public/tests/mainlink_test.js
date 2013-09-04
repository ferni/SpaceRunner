/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, asyncTest, test, ok, equal, start, th,
me, $, utils*/

module('mainlink.js');
asyncTest('Item click', function() {
    'use strict';
    th.onGameReady(function() {
        $('.items #item_weapon').trigger('click');
        equal(screen.chosen.type, 'weapon', 'choose weapon');
        ok($('.items #item_weapon').hasClass('chosen'),
            "weapon thumbnail has 'chosen' class");

        $('.items #item_engine').trigger('click');
        equal(screen.chosen.type, 'engine', 'choose engine');
        ok($('.items #item_engine').hasClass('chosen'),
            "engine thumbnail has 'chosen' class");
        ok(!$('.items #item_weapon').hasClass('chosen'),
            "now weapon does not longer have 'chosen' class");
        start();
    });
});
