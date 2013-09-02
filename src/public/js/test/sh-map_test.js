/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, test, sh, equal*/

module('sh-map');
test('Basic map', function() {
    'use strict';
    var map = new sh.Map([
        [1, 2, 3],
        [4, 5, 6]]);
    equal(map.at(0, 0), 1);
    equal(map.at(1, 0), 2);
    equal(map.at(2, 0), 3);
    equal(map.at(0, 1), 4);
    equal(map.at(1, 1), 5);
    equal(map.at(2, 1), 6);
    equal(map.at(3, 0), undefined);
    equal(map.width, 3, 'correct width');
    equal(map.height, 2, 'correct height');
});

test('Entity map', function() {
    'use strict';
    var entities, map,
        power = new sh.items.Power(null, 1, 1),
        console = new sh.items.Console(null, 0, 1);
    entities = [
        console,
        power
    ];
    map = new sh.EntityMap(3, 2, entities);

    equal(map.width, 3, 'correct width');
    equal(map.height, 2, 'correct height');
    /*
    The map should be like this:
          0 0 0
          C P P
     */
    equal(map.at(0, 0), 0);
    equal(map.at(1, 0), 0);
    equal(map.at(2, 0), 0);
    equal(map.at(0, 1), console);
    equal(map.at(1, 1), power);
    equal(map.at(2, 1), power);

    console.x = 1;
    console.y = 0;
    map.update();
    /*
     Now the map should be like this:
     0 C 0
     0 P P
     */
    equal(map.at(0, 0), 0);
    equal(map.at(1, 0), console);
    equal(map.at(2, 0), 0);
    equal(map.at(0, 1), 0);
    equal(map.at(1, 1), power);
    equal(map.at(2, 1), power);
});

test('CompoundMap', function() {
    'use strict';
    var entities, entityMap, power, console, numberMap, map;
    power = new sh.items.Power(null, 1, 1);
    console = new sh.items.Console(null, 0, 1);
    entities = [
        console,
        power
    ];
    entityMap = new sh.EntityMap(3, 2, entities);
    numberMap = new sh.Map([
        [1, 2, 3],
        [4, 5, 6]
    ]);
    map = new sh.CompoundMap([numberMap, entityMap]);
    equal(map.width, 3, 'correct width');
    equal(map.height, 2, 'correct height');
    /*
     The map should be like this:
     1 2 3
     C P P
     */
    equal(map.at(0, 0), 1);
    equal(map.at(1, 0), 2);
    equal(map.at(2, 0), 3);
    equal(map.at(0, 1), console);
    equal(map.at(1, 1), power);
    equal(map.at(2, 1), power);

    console.x = 1;
    console.y = 0;
    entityMap.update();
    /*
     Now the map should be like this:
     1 C 3
     4 P P
     */
    equal(map.at(0, 0), 1);
    equal(map.at(1, 0), console);
    equal(map.at(2, 0), 3);
    equal(map.at(0, 1), 4);
    equal(map.at(1, 1), power);
    equal(map.at(2, 1), power);

});

