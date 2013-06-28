
 /*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global */



exports.init = function(app, chatRoutes){
    GLOBAL.linesInServer = [{
        id:0,
        sender:'Server',
        message:'Logged into chat'
    }];
    app.get('/chat/getlines', chatRoutes.getlines);
    app.post('/chat/send', chatRoutes.send);
};

exports.getLines = function(params){

};