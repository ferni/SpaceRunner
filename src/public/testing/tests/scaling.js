/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, test, sh, make, equal, th, itemVMs*/

module('Scaling');
test('Item sizes', function() {
    'use strict';
    var item = new sh.items.Power({x: 1, y: 1}),
        itemVM = new itemVMs.Power(item);
    equal(itemVM.size[0], th.s(2));
});
