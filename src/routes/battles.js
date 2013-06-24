/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

var model = require('../model'),
    _ = require('underscore')._;


exports.create = function(req, res) {
    var battleID = battles.length;
    if(!req.body.shipJsonString) {
        throw 'shipJsonString must be provided';
    }
    battles.push(new model.Battle({id: battleID, shipJsonString: req.body.shipJsonString}));
    res.json({ok: true, battleID: battleID});
};

exports.join = function(req, res) {
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