
 /*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global */

 var url = require('url'),
     auth = require('../auth');

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

     line.id = linesInServer.length;
     line.sender = auth.getPlayer(req).name;
     linesInServer.push(line);

     res.json({});
 };