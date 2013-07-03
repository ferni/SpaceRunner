/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

var model = require('../model'),
    auth = require('../auth'),
    _ = require('underscore')._;


exports.create = function(req, res, next) {
    'use strict';
    var id = battleSetUps.length;
    console.log('creating...');
    if(!req.body.shipJsonString) {
        next(new Error('shipJsonString must be provided'));
    }
    var bsu = new model.BattleSetUp({
        id: id,
        creator: auth.getPlayer(req),
        shipJsonString: req.body.shipJsonString});
    battleSetUps.push(bsu);
    res.json(bsu.toJson());
};


exports.join = function(req, res, next) {
    'use strict';
    var battleID = req.body.battleID,
        battle;
    if(typeof battleID === 'undefined') {
        return next(new Error('battleID must be provided'));
    }
    battle = _.find(battleSetUps, function(b){
        return b.id == battleID;
    });
    if(!battle) {
        return next(new Error('battle ' + battleID +' not found'));
    }
    if(battle.isFull()) {
        res.json({error: 'battle is full'});
    } else{
        battle.addPlayer(auth.getPlayer(req));
        res.json(battle.toJson());
    }
};