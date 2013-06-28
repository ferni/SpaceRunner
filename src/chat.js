
 /*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global */

var chatRoutes = require('./routes/chat');

exports.init = function(app){
    GLOBAL.linesInServer = [{
        id:0,
        sender:'Server',
        message:'Logged into chat'
    }];
    app.get('/chat/getlines', chatRoutes.getlines);
    app.post('/chat/send', chatRoutes.send);
};