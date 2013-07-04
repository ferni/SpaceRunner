/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global */

exports.get = function(req, res, next) {
    var id = req.body.id,
        battle = _.find(battles, function(b){
            return b.id == req.id;
        });
    if(!battle) {
        next(new Error('Battle not found, id: ' + id));
        return;
    }
    return res.json(battle.toJson());
};
