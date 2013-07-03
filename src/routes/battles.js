/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

var model = require('../model'),
    auth = require('../auth'),
    _ = require('underscore')._;


exports.create = function(req, res) {
    'use strict';
    var id = battleSetUps.length;
    if(!req.body.shipJsonString) {
        throw 'shipJsonString must be provided';
    }
    var bsu = new model.BattleSetUp({
        id: id,
        creator: auth.getPlayer(req),
        shipJsonString: req.body.shipJsonString});
    battleSetUps.push(bsu);
    res.json(bsu.toJson());
};


exports.join = function(req, res) {
    'use strict';
    var battleID = req.body.battleID,
        battle;
    if(battleID === undefined) {
        throw 'battleID must be provided';
    }
    battle = _.find(battles, function(battle){
        return battle.id == battleID;
    });
    if(!battle) {
        throw 'battle ' + battleID +' not found';
    }
    if(battle.isFull()) {
        res.json({error: 'battle is full'});
    } else{
        battle.addPlayer(req.session.playerID);
        res.json({shipJsonString: battle.shipJsonString});
    }

};