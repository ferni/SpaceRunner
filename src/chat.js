/*
-*- coding: utf-8 -*-
* vim: set ts=4 sw=4 et sts=4 ai:
* Copyright 2013 MITHIS
* All rights reserved.
*/

/*global GLOBAL, linesInServer, exports*/


(function(chat) {
    'use strict';
    chat.init = function(app, chatRoutes) {
        GLOBAL.linesInServer = [{
            id: 0,
            sender: 'Server',
            message: 'Logged into chat'
        }];
        app.get('/chat/getlines', chatRoutes.getlines);
        app.post('/chat/send', chatRoutes.send);
    };

    chat.addLine = function(sender, message) {
        linesInServer.push({
            sender: sender,
            message: message,
            id: linesInServer.length
        });
    };

    chat.log = function(message) {
        console.log(message);
        chat.addLine('Server', message);
    };

    chat.error = chat.log;
}(exports));
