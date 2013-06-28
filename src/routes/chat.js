
 /*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global */

 var url = require('url'),
     model = require('../model');

 exports.getlines = function(req, res){
     var queryData = url.parse(req.url, true).query;
     var lastLineId = queryData.last,
         maxLines = queryData.max,
         lastLineIndex,
         i;
     for(i = 0; i < linesInServer.length; i++){
         if(linesInServer[i].id == lastLineId){
             lastLineIndex = i;
             break;
         }
     }
     var forSending  = [];
     if(maxLines && linesInServer.length - lastLineIndex > maxLines){
         lastLineIndex = linesInServer.length - maxLines - 1;
     }
     for(i = lastLineIndex + 1; i < linesInServer.length; i++){
         forSending.push(linesInServer[i]);
     }
     res.json(forSending);
 };

 exports.send = function(req, res){
     var line = req.body.line;
     if(typeof req.session.playerID === 'undefined') {
         //warn the player
     } else{
         line.id = linesInServer.length;
         line.sender = model.playerByID(req.session.playerID).name;
         linesInServer.push(line);
     }

     res.json({});
 };