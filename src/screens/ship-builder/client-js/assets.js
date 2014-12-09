/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global module, shipType*/

// game resources
// in the case of the items, set their image name equal to their type.
function getShipAssets(shipType) {
    'use strict';
    var race = shipType.split('_')[0];
    return [{
        name: shipType,
        type: 'tmx',
        src: '/_common/outlines/' + shipType + '.tmx'
    }, {
        name: shipType + '_img',
        type: 'image',
        src: '/_common/img/render/ships/' + race +
            '/' + shipType + '_img.png'
    }];
}

var assets = [{
    name: 'outline',
    type: 'image',
    src: '/_common/img/render/outline.png'
}, {
    name: 'selector',
    type: 'image',
    src: '/_common/img/render/selector.png'
}, {
    name: 'pause-icon',
    type: 'image',
    src: '/_common/img/render/pause-icon.png'
}, {
    name: 'weapon',
    type: 'image',
    src: '/_common/img/render/weapon_01.png'
}, {
    name: 'engine',
    type: 'image',
    src: '/_common/img/render/engine_01.png'
}, {
    name: 'power',
    type: 'image',
    src: '/_common/img/render/power_01.png'
}, {
    name: 'console',
    type: 'image',
    src: '/_common/img/render/console_02.png'
}, {
    name: 'component',
    type: 'image',
    src: '/_common/img/render/components_01.png'
}, {
    name: 'door',
    type: 'image',
    src: '/_common/img/render/door_01.png'
}, {
    name: 'wall',
    type: 'image',
    src: '/_common/img/render/wall_001.png'
}, {
    name: 'weakspot',
    type: 'image',
    src: '/_common/img/render/weakspot.png'
}, {
    name: 'teleporter',
    type: 'image',
    src: '/_common/img/render/teleporter.png'
}, {
    name: 'metatiles32x32',
    type: 'image',
    src: '/_common/img/render/metatiles32x32.png'
}, {
    name: 'area_01',
    type: 'tmx',
    src: '/_common/outlines/small.tmx'
}, {
    name: 'test',
    type: 'tmx',
    src: '/_common/outlines/test.tmx'
}, {
    name: 'button',
    type: 'image',
    src: '/_common/img/render/button.png'
}, {
    name: 'creatures',
    type: 'image',
    src: '/_common/img/render/creatures.png'
}, {
    name: 'creatures_16x16',
    type: 'image',
    src: '/_common/img/render/creatures_16x16.png'
}, {
    name: 'star_hit_white',
    type: 'image',
    src: '/_common/img/render/star_hit_white.png'
}, {
    name: 'nothing',
    type: 'image',
    src: '/_common/img/render/nothing.png'
}, {
    name: 'projectile',
    type: 'image',
    src: '/_common/img/render/projectile.png'
}, {
    name: 'markers',
    type: 'image',
    src: '/_common/img/render/markers.png'
}, {
    name: 'charging-weapon-icon',
    type: 'image',
    src: '/_common/img/render/charging-weapon-icon.png'
}];

assets = assets.concat(getShipAssets(shipType));
module.exports = assets;